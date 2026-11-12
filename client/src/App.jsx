import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Produtos from './pages/Produtos.jsx';
import ProdutoForm from './pages/ProdutoForm.jsx';
import ProdutoDetalhe from './pages/ProdutoDetalhe.jsx';
import RegistrarMovimentacao from './pages/RegistrarMovimentacao.jsx';
import EstoqueBaixo from './pages/EstoqueBaixo.jsx';
import Historico from './pages/Historico.jsx';
import ConfigurarConta from './pages/ConfigurarConta.jsx';
import Usuarios from './pages/Usuarios.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

function RequireAuth() {
  const { status, erroSessao, verificarSessao } = useAuth();
  const location = useLocation();

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
  if (status !== 'autenticado') return <Navigate to="/" replace state={{ from: location }} />;
  return <Outlet />;
}

function RequireAdmin() {
  const { usuario } = useAuth();
  return usuario?.papel === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/configurar" element={<ConfigurarConta />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/produtos/novo" element={<ProdutoForm />} />
          <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
          <Route path="/produtos/:id/editar" element={<ProdutoForm />} />
          <Route path="/entrada" element={<RegistrarMovimentacao key="entrada" tipo="entrada" />} />
          <Route path="/saida" element={<RegistrarMovimentacao key="saida" tipo="saida" />} />
          <Route path="/estoque-baixo" element={<EstoqueBaixo />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/movimentacoes" element={<Navigate to="/historico" replace />} />
          <Route element={<RequireAdmin />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
