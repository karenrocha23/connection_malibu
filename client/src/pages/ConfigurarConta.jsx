import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, LockKeyhole, Store, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';

export default function ConfigurarConta() {
  const { status, configurarAdministrador } = useAuth();
  const [estado, setEstado] = useState(null);
  const [erroEstado, setErroEstado] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [chave, setChave] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let ativo = true;
    api.obterEstadoConfiguracao()
      .then((resultado) => { if (ativo) setEstado(resultado); })
      .catch((falha) => { if (ativo) setErroEstado(falha.message); });
    return () => { ativo = false; };
  }, []);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setErro('');
    if (senha !== confirmacao) {
      setErro('As senhas não conferem.');
      return;
    }

    setEnviando(true);
    try {
      await configurarAdministrador({ usuario, senha, setupKey: chave });
      navigate('/dashboard', { replace: true });
    } catch (falha) {
      setErro(falha.message);
      if (falha.status === 409) {
        setEstado({ setupRequired: false, setupAvailable: false });
      }
    } finally {
      setEnviando(false);
    }
  }

  if (status === 'carregando' || !estado && !erroEstado) {
    return <main className="p-8 text-center text-tinta/60">Verificando configuração inicial...</main>;
  }
  if (status === 'erro') {
    return <main className="p-8 text-center text-red-700" role="alert">Não foi possível verificar sua sessão.</main>;
  }
  if (status === 'autenticado' || estado && !estado.setupRequired) return <Navigate to="/" replace />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-areia-50 px-5 py-10">
      <section className="card w-full max-w-lg p-6 sm:p-9">
        <div className="mb-7 flex items-center gap-3 text-mar-900">
          <span className="flex size-11 items-center justify-center rounded-xl bg-mar-100"><Store size={23} aria-hidden="true" /></span>
          <div>
            <p className="font-bold tracking-[0.12em]">CONNECTION</p>
            <p className="text-sm text-tinta/55">Configuração inicial</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-tinta">Criar conta administradora</h1>
        <p className="mt-2 text-sm leading-relaxed text-tinta/65">
          Esta etapa só pode ser concluída uma vez. A chave foi definida nas variáveis privadas do servidor.
        </p>

        {erroEstado ? (
          <div className="mt-6 space-y-3">
            <p role="alert" className="text-sm text-red-700">{erroEstado}</p>
            <p className="text-sm text-tinta/65">Verifique se o servidor e o banco de dados estão disponíveis.</p>
          </div>
        ) : !estado?.setupAvailable ? (
          <div className="mt-6 rounded-lg border border-areia-200 bg-areia-50 p-4 text-sm leading-relaxed text-tinta/70">
            A configuração inicial ainda é necessária, mas não está habilitada. Defina `AUTH_SETUP_KEY` como uma
            variável secreta no ambiente do servidor, com pelo menos 32 caracteres, e reinicie o serviço.
          </div>
        ) : (
          <form onSubmit={enviarFormulario} className="mt-6 space-y-4">
            <div>
              <label htmlFor="setup-usuario" className="mb-1.5 block text-sm font-semibold">Usuário administrador</label>
              <div className="relative">
                <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
                <input id="setup-usuario" required minLength={3} maxLength={40} autoComplete="username"
                  value={usuario} onChange={(evento) => setUsuario(evento.target.value)}
                  placeholder="3 a 40 caracteres" className="campo h-11 pl-10" />
              </div>
              <p className="mt-1 text-xs text-tinta/50">Use letras sem acento, números, ponto, _ ou -.</p>
            </div>

            <div>
              <label htmlFor="setup-senha" className="mb-1.5 block text-sm font-semibold">Senha</label>
              <div className="relative">
                <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
                <input id="setup-senha" type="password" required minLength={12} maxLength={128}
                  autoComplete="new-password" value={senha} onChange={(evento) => setSenha(evento.target.value)}
                  placeholder="Mínimo de 12 caracteres" className="campo h-11 pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="setup-confirmacao" className="mb-1.5 block text-sm font-semibold">Confirme a senha</label>
              <input id="setup-confirmacao" type="password" required maxLength={128} autoComplete="new-password"
                value={confirmacao} onChange={(evento) => setConfirmacao(evento.target.value)}
                className="campo h-11" />
            </div>

            <div>
              <label htmlFor="setup-chave" className="mb-1.5 block text-sm font-semibold">Chave de configuração</label>
              <div className="relative">
                <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
                <input id="setup-chave" type="password" required maxLength={256} autoComplete="off"
                  value={chave} onChange={(evento) => setChave(evento.target.value)}
                  className="campo h-11 pl-10" />
              </div>
              <p className="mt-1 text-xs text-tinta/50">Não compartilhe esta chave nem a salve no código do site.</p>
            </div>

            {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
            <button type="submit" disabled={enviando} className="btn btn-primario h-11 w-full">
              {enviando ? 'Criando conta...' : 'Criar administrador'}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
