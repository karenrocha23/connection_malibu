import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { asyncRoute } from '../utils/asyncRoute.js';
import { opcoesCookieSessao, lerTokenSessao, exigirAutenticacao, NOME_COOKIE_SESSAO } from '../middleware/autenticacao.js';
import {
  buscarUsuario,
  contarUsuarios,
  criarHashSenha,
  criarPrimeiroAdministrador,
  criarSessao,
  encerrarSessao,
  validarCredenciais,
  verificarSenha,
} from '../services/auth.service.js';

const router = Router();
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const limiteConfiguracao = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
const chaveConfiguracao = process.env.AUTH_SETUP_KEY;
const configuracaoDisponivel = typeof chaveConfiguracao === 'string' && chaveConfiguracao.length >= 32;

router.get('/setup-status', asyncRoute(async (_req, res) => {
  const primeiroAcesso = await contarUsuarios() === 0;
  res.set('Cache-Control', 'no-store');
  res.json({
    setupRequired: primeiroAcesso,
    setupAvailable: primeiroAcesso && configuracaoDisponivel,
  });
}));

router.post('/setup', limiteConfiguracao, asyncRoute(async (req, res) => {
  const { usuario, senha, setupKey } = req.body ?? {};
  const credenciais = validarCredenciais(usuario, senha);
  if (credenciais.erro) return res.status(400).json({ erro: credenciais.erro });
  if (typeof setupKey !== 'string' || setupKey.length > 256) {
    return res.status(400).json({ erro: 'Informe a chave de configuração.' });
  }
  if (!configuracaoDisponivel) {
    return res.status(503).json({ erro: 'A configuração inicial não está habilitada neste servidor.' });
  }

  const chaveInformada = Buffer.from(setupKey);
  const chaveEsperada = Buffer.from(chaveConfiguracao);
  const chaveValida = chaveInformada.length === chaveEsperada.length
    && timingSafeEqual(chaveInformada, chaveEsperada);
  if (!chaveValida) {
    return res.status(401).json({ erro: 'Chave de configuração inválida.' });
  }

  const senhaHash = await criarHashSenha(credenciais.senha);
  const id = await criarPrimeiroAdministrador(credenciais.usuario, senhaHash);
  if (!id) {
    return res.status(409).json({ erro: 'A configuração inicial já foi concluída ou está em andamento.' });
  }

  const token = randomBytes(32).toString('base64url');
  await criarSessao(id, token);
  res.cookie(NOME_COOKIE_SESSAO, token, opcoesCookieSessao());
  res.status(201).json({ usuario: { id, usuario: credenciais.usuario, papel: 'admin' } });
}));

router.post('/login', limiteLogin, asyncRoute(async (req, res) => {
  const { usuario, senha } = req.body ?? {};
  if (typeof usuario !== 'string' || typeof senha !== 'string' || usuario.length > 100 || senha.length > 128) {
    return res.status(400).json({ erro: 'Informe usuário e senha válidos.' });
  }

  const registro = await buscarUsuario(usuario);
  const senhaValida = registro
    ? await verificarSenha(senha, registro.senha_hash)
    : await verificarSenha(senha, 'scrypt$MDEyMzQ1Njc4OWFiY2RlZg$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

  if (!registro || !senhaValida) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
  }

  const token = randomBytes(32).toString('base64url');
  await criarSessao(registro.id, token);
  res.cookie(NOME_COOKIE_SESSAO, token, opcoesCookieSessao());
  res.json({ usuario: { id: registro.id, usuario: registro.usuario, papel: registro.papel } });
}));

router.get('/session', exigirAutenticacao, (req, res) => {
  res.json({ usuario: req.usuario });
});

router.post('/logout', asyncRoute(async (req, res) => {
  const token = lerTokenSessao(req);
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) await encerrarSessao(token);
  res.clearCookie(NOME_COOKIE_SESSAO, opcoesCookieSessao());
  res.status(204).end();
}));

export default router;
