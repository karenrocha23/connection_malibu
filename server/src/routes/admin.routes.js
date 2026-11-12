import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { exigirAdministrador } from '../middleware/autenticacao.js';
import { asyncRoute } from '../utils/asyncRoute.js';
import { criarHashSenha, criarUsuario, listarUsuarios, validarCredenciais } from '../services/auth.service.js';

const router = Router();
const limiteCriacao = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(exigirAdministrador);

router.get('/users', asyncRoute(async (_req, res) => {
  res.json({ usuarios: await listarUsuarios() });
}));

router.post('/users', limiteCriacao, asyncRoute(async (req, res) => {
  const credenciais = validarCredenciais(req.body?.usuario, req.body?.senha);
  if (credenciais.erro) return res.status(400).json({ erro: credenciais.erro });

  const senhaHash = await criarHashSenha(credenciais.senha);
  try {
    const id = await criarUsuario(credenciais.usuario, senhaHash);
    res.status(201).json({ usuario: { id, usuario: credenciais.usuario, papel: 'usuario' } });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Esse nome de usuário já está cadastrado.' });
    }
    throw erro;
  }
}));

export default router;
