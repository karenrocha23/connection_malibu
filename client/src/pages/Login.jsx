import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Boxes, Eye, EyeOff, LockKeyhole, PackageCheck, Store, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [checandoConfiguracao, setChecandoConfiguracao] = useState(true);
  const [erroConfiguracao, setErroConfiguracao] = useState('');
  const { entrar, status, erroSessao, verificarSessao } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (status !== 'nao-autenticado') return;
    let ativo = true;
    setChecandoConfiguracao(true);
    setErroConfiguracao('');
    api.obterEstadoConfiguracao()
      .then((estado) => {
        if (ativo && estado.setupAvailable) navigate('/configurar', { replace: true });
        else if (ativo && estado.setupRequired) {
          setErroConfiguracao('Ainda não há contas. O administrador precisa configurar AUTH_SETUP_KEY no servidor antes do primeiro acesso.');
        }
      })
      .catch((erroEstado) => {
        if (ativo) setErroConfiguracao(erroEstado.message);
      })
      .finally(() => {
        if (ativo) setChecandoConfiguracao(false);
      });
    return () => { ativo = false; };
  }, [status, navigate]);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(usuario, senha);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (erroLogin) {
      setErro(erroLogin.message);
    } finally {
      setEnviando(false);
    }
  }

  if (status === 'carregando') {
    return <main className="p-8 text-center text-tinta/60">Verificando sua sessão...</main>;
  }
  if (status === 'erro') {
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <p role="alert" className="text-red-700">{erroSessao}</p>
        <button type="button" className="btn btn-primario mt-4" onClick={verificarSessao}>Tentar novamente</button>
      </main>
    );
  }
  if (status === 'autenticado') return <Navigate to="/dashboard" replace />;
  if (checandoConfiguracao) return <main className="p-8 text-center text-tinta/60">Verificando configuração inicial...</main>;

  return (
    <main className="min-h-screen bg-areia-50 md:grid md:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-mar-900 p-12 text-white md:flex md:flex-col md:justify-between lg:p-16">
        <div className="absolute -right-32 -top-32 size-96 rounded-full border border-white/10" aria-hidden="true" />
        <div className="absolute -bottom-48 -left-36 size-[30rem] rounded-full border border-white/10" aria-hidden="true" />

        <a href="/" className="relative inline-flex w-fit items-center gap-3" aria-label="CONNECTION, início">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <Store size={25} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xl font-bold tracking-[0.12em]">CONNECTION</span>
            <span className="text-sm text-mar-100/70">Controle de Estoque</span>
          </span>
        </a>

        <div className="relative max-w-xl">
          <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
            <Boxes size={30} aria-hidden="true" />
          </span>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Seu estoque em conexão
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
            Mais controle para o dia a dia do seu negócio.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-mar-100/75">
            Acompanhe produtos, movimentações e níveis de estoque em um só lugar.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-sm text-mar-100/70">
          <PackageCheck size={18} aria-hidden="true" />
          <span>Organização simples. Gestão mais tranquila.</span>
        </div>
      </section>

      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-10 md:justify-center md:px-12 lg:px-20">
        <a href="/" className="mb-12 inline-flex items-center gap-2 self-start text-mar-900 md:hidden">
          <Store size={24} aria-hidden="true" />
          <span className="font-bold tracking-[0.12em]">CONNECTION</span>
        </a>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-mar-700">Bem-vindo de volta</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-tinta">Acesse sua conta</h2>
            <p className="mt-2 text-tinta/60">Entre com seu usuário e senha para continuar.</p>
          </div>

          <form onSubmit={enviarFormulario} className="space-y-5">
            {erroConfiguracao && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Não foi possível verificar a configuração inicial: {erroConfiguracao}
              </p>
            )}
            <div>
              <label htmlFor="usuario" className="mb-2 block text-sm font-semibold text-tinta">
                Usuário
              </label>
              <div className="relative">
                <UserRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  autoComplete="username"
                  placeholder="Digite seu usuário"
                  required
                  maxLength={40}
                  value={usuario}
                  onChange={(evento) => setUsuario(evento.target.value)}
                  className="campo h-12 pl-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="mb-2 block text-sm font-semibold text-tinta">
                Senha
              </label>
              <div className="relative">
                <LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
                <input
                  id="senha"
                  name="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  required
                  maxLength={128}
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  className="campo h-12 pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((visivel) => !visivel)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                  className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-tinta/50 hover:bg-areia-50 hover:text-tinta focus-visible:outline-2 focus-visible:outline-mar-700"
                >
                  {mostrarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
            <button type="submit" disabled={enviando} className="btn btn-primario h-12 w-full text-base">
              {enviando ? 'Verificando...' : 'Entrar'}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-tinta/55">
            A senha é protegida e nunca é armazenada em texto puro.
          </p>
        </div>

        <p className="mx-auto mt-auto pt-12 text-center text-xs text-tinta/45 md:absolute md:bottom-6 md:left-0 md:right-0">
          CONNECTION · Controle de Estoque
        </p>
      </section>
    </main>
  );
}
