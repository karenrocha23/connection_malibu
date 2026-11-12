import { buscarSessao } from '../services/auth.service.js';

export const NOME_COOKIE_SESSAO = 'connection_session';

export function lerTokenSessao(req) {
  const cookies = req.headers.cookie?.split(';') ?? [];
  const cookie = cookies.map((item) => item.trim()).find((item) => item.startsWith(`${NOME_COOKIE_SESSAO}=`));
  return cookie?.slice(NOME_COOKIE_SESSAO.length + 1) || null;
}

export async function exigirAutenticacao(req, res, next) {
  const token = lerTokenSessao(req);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return res.status(401).json({ erro: 'Autenticação necessária.' });
  }

  try {
    const usuario = await buscarSessao(token);
    if (!usuario) return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
    req.usuario = { id: usuario.id, usuario: usuario.usuario, papel: usuario.papel };
    next();
  } catch (erro) {
    next(erro);
  }
}

export function exigirAdministrador(req, res, next) {
  if (req.usuario?.papel !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }
  next();
}

export function opcoesCookieSessao() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
