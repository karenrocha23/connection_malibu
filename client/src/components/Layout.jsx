import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, History, LayoutDashboard, LogOut, PackageMinus, PackagePlus, Store, TriangleAlert, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const links = [
  { para: '/dashboard', texto: 'Dashboard', Icone: LayoutDashboard, exato: true },
  { para: '/produtos', texto: 'Produtos', Icone: Boxes },
  { para: '/estoque-baixo', texto: 'Estoque Baixo', Icone: TriangleAlert },
  { para: '/entrada', texto: 'Entrada', Icone: PackagePlus },
  { para: '/saida', texto: 'Saída', Icone: PackageMinus },
  { para: '/historico', texto: 'Histórico', Icone: History },
];

export default function Layout() {
  const { usuario, sair } = useAuth();
  const [erroLogout, setErroLogout] = useState('');
  const navigate = useNavigate();
  const linksVisiveis = usuario?.papel === 'admin'
    ? [...links, { para: '/usuarios', texto: 'Usuários', Icone: UsersRound }]
    : links;

  async function encerrarSessao() {
    setErroLogout('');
    try {
      await sair();
      navigate('/', { replace: true });
    } catch (erro) {
      setErroLogout(erro.message);
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-mar-900 text-white md:min-h-screen md:w-60 md:shrink-0">
        <div className="flex items-center gap-3 px-6 py-5">
          <Store size={26} aria-hidden="true" />
          <div>
            <p className="text-lg font-bold leading-tight">CONNECTION</p>
            <p className="text-sm text-mar-100/70">Controle de Estoque</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0" aria-label="Menu principal">
          {linksVisiveis.map(({ para, texto, Icone, exato }) => (
            <NavLink
              key={para}
              to={para}
              end={exato}
              className={({ isActive }) =>
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-white ' +
                (isActive ? 'bg-white/15 text-white' : 'text-mar-100/80 hover:bg-white/10')
              }
            >
              <Icone size={18} aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-4 md:mt-6 md:block">
          <p className="truncate text-sm text-mar-100/80" title={usuario?.usuario}>{usuario?.usuario}</p>
          <button
            type="button"
            onClick={encerrarSessao}
            className="mt-0 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-mar-100/80 hover:bg-white/10 hover:text-white md:mt-3"
          >
            <LogOut size={16} aria-hidden="true" />
            Sair
          </button>
          {erroLogout && <p role="alert" className="mt-2 text-xs text-red-200">{erroLogout}</p>}
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
