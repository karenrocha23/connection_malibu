import { useEffect, useState } from 'react';
import { KeyRound, UserPlus, UsersRound } from 'lucide-react';
import { api } from '../services/api.js';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarUsuarios() {
    setCarregando(true);
    try {
      const resultado = await api.listarUsuarios();
      setUsuarios(resultado.usuarios);
      setErro('');
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarUsuarios();
  }, []);

  async function criar(evento) {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    if (senha !== confirmacao) {
      setErro('As senhas não conferem.');
      return;
    }

    setSalvando(true);
    try {
      const resultado = await api.criarUsuario({ usuario, senha });
      setUsuarios((atuais) => [...atuais, { ...resultado.usuario, criado_em: new Date().toISOString() }]);
      setUsuario('');
      setSenha('');
      setConfirmacao('');
      setSucesso(`Usuário "${resultado.usuario.usuario}" criado.`);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <header className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-mar-700">Administração</p>
        <h1 className="mt-1 text-2xl font-bold">Usuários</h1>
        <p className="mt-1 text-sm text-tinta/60">Crie contas individuais para quem precisa acessar o estoque.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <form onSubmit={criar} className="card h-fit p-5">
          <h2 className="flex items-center gap-2 font-bold"><UserPlus size={19} aria-hidden="true" /> Novo usuário</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="novo-usuario" className="mb-1.5 block text-sm font-semibold">Usuário</label>
              <input id="novo-usuario" required minLength={3} maxLength={40} autoComplete="username"
                value={usuario} onChange={(evento) => setUsuario(evento.target.value)}
                className="campo" placeholder="3 a 40 caracteres" />
            </div>
            <div>
              <label htmlFor="nova-senha" className="mb-1.5 block text-sm font-semibold">Senha</label>
              <input id="nova-senha" type="password" required minLength={12} maxLength={128}
                autoComplete="new-password" value={senha} onChange={(evento) => setSenha(evento.target.value)}
                className="campo" placeholder="Mínimo de 12 caracteres" />
            </div>
            <div>
              <label htmlFor="confirmacao-senha" className="mb-1.5 block text-sm font-semibold">Confirme a senha</label>
              <input id="confirmacao-senha" type="password" required maxLength={128} autoComplete="new-password"
                value={confirmacao} onChange={(evento) => setConfirmacao(evento.target.value)} className="campo" />
            </div>
            {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
            {sucesso && <p role="status" className="text-sm text-emerald-700">{sucesso}</p>}
            <button type="submit" disabled={salvando} className="btn btn-primario w-full">
              <KeyRound size={17} aria-hidden="true" />
              {salvando ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-tinta/55">
            A senha deve ter pelo menos 12 caracteres. O novo usuário terá acesso ao sistema, sem permissões administrativas.
          </p>
        </form>

        <section className="card overflow-hidden">
          <header className="flex items-center gap-2 border-b border-areia-200 px-5 py-4">
            <UsersRound size={19} aria-hidden="true" />
            <h2 className="font-bold">Contas cadastradas</h2>
          </header>
          {erro && usuarios.length === 0 ? (
            <p role="alert" className="p-5 text-sm text-red-700">{erro}</p>
          ) : carregando ? (
            <p className="p-5 text-sm text-tinta/60">Carregando usuários...</p>
          ) : (
            <ul className="divide-y divide-areia-200">
              {usuarios.map((conta) => (
                <li key={conta.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <span className="truncate font-medium">{conta.usuario}</span>
                  <span className="shrink-0 rounded-full bg-areia-50 px-2.5 py-1 text-xs text-tinta/65">
                    {conta.papel === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
