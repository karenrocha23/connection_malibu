import express from 'express';
import produtosRoutes from './routes/produtos.routes.js';
import movimentacoesRoutes from './routes/movimentacoes.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { exigirAutenticacao } from './middleware/autenticacao.js';
import { ErroValidacao } from './services/produtos.validacao.js';
import { initializeDatabase } from './database/db.js';

const app = express();

let databaseInitialization;

app.use(async (_req, res, next) => {
  try {
    databaseInitialization ??= initializeDatabase();
    await databaseInitialization;
    next();
  } catch (erro) {
    databaseInitialization = null;
    next(erro);
  }
});

app.set('trust proxy', process.env.VERCEL === '1' ? 1 : false);
app.use(express.json());
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/saude', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api', exigirAutenticacao);
app.use('/api/admin', adminRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/movimentacoes', movimentacoesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Tratamento de erros
app.use((err, _req, res, _next) => {
  if (err instanceof ErroValidacao) {
    return res.status(err.status).json({ erro: err.message, erros: err.erros });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'Os dados enviados são inválidos.' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

export default app;
