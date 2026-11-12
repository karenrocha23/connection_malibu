import { Router } from 'express';
import {
  listarProdutos,
  buscarProdutoPorId,
  listarCategorias,
  listarProdutosParaRepor,
  resumoEstoque,
  criarProduto,
  atualizarProduto,
} from '../services/produtos.service.js';
import { asyncRoute } from '../utils/asyncRoute.js';

const router = Router();

const lerId = (req) => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const naoEncontrado = (res) => res.status(404).json({ erro: 'Produto não encontrado.' });

// GET /api/produtos?busca=havaianas&status=estoque_baixo
router.get('/', asyncRoute(async (req, res) => {
  const { busca, status } = req.query;
  res.json(await listarProdutos({ busca: busca?.trim(), status }));
}));

// Rotas fixas ficam ANTES de /:id
router.get('/resumo', asyncRoute(async (_req, res) => res.json(await resumoEstoque())));
router.get('/reposicao', asyncRoute(async (_req, res) => res.json(await listarProdutosParaRepor())));
router.get('/categorias', asyncRoute(async (_req, res) => res.json(await listarCategorias())));

// POST /api/produtos
router.post('/', asyncRoute(async (req, res) => res.status(201).json(await criarProduto(req.body))));

// GET /api/produtos/:id
router.get('/:id', asyncRoute(async (req, res) => {
  const id = lerId(req);
  const produto = id && await buscarProdutoPorId(id);
  if (!produto) return naoEncontrado(res);
  res.json(produto);
}));

// PUT /api/produtos/:id
router.put('/:id', asyncRoute(async (req, res) => {
  const id = lerId(req);
  const produto = id && await atualizarProduto(id, req.body);
  if (!produto) return naoEncontrado(res);
  res.json(produto);
}));

export default router;
