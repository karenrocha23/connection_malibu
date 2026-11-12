import { Router } from 'express';
import { obterDashboard } from '../services/dashboard.service.js';
import { asyncRoute } from '../utils/asyncRoute.js';

const router = Router();

// GET /api/dashboard
router.get('/', asyncRoute(async (_req, res) => res.json(await obterDashboard())));

export default router;
