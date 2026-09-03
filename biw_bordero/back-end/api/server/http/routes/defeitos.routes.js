// routes/defeitos.routes.js
import express from "express";
import { authMiddleware } from "../../../middlewares/auth.js";
import {
  criarDefeito,
  listarDefeitos,
  buscarDefeitoPorId,
  atualizarDefeito,
  deletarDefeito,
  estatisticasDefeitos,
  defeitosPorModelo,
  defeitosPorQuadrante,
  dashboardDefeitos,
} from "../../../usecases/defeitos/defeitos.pgService.js";

const router = express.Router();

// =============================
// DEFEITOS - Rotas
// =============================

// POST /defeitos - Criar novo defeito
router.post("/", authMiddleware, criarDefeito);

// GET /defeitos - Listar defeitos com filtros
router.get("/", authMiddleware, listarDefeitos);

// GET /defeitos/dashboard - Dashboard de defeitos
router.get("/dashboard", authMiddleware, dashboardDefeitos);

// GET /defeitos/stats - Estatísticas
router.get("/stats", authMiddleware, estatisticasDefeitos);

// GET /defeitos/modelo/:modelo - Defeitos por modelo
router.get("/modelo/:modelo", authMiddleware, defeitosPorModelo);

// GET /defeitos/quadrante/:visao/:quadrante - Defeitos por quadrante
router.get(
  "/quadrante/:visao/:quadrante",
  authMiddleware,
  defeitosPorQuadrante,
);

// GET /defeitos/:id - Buscar defeito por ID
router.get("/:id", authMiddleware, buscarDefeitoPorId);

// PUT /defeitos/:id - Atualizar defeito
router.put("/:id", authMiddleware, atualizarDefeito);

// DELETE /defeitos/:id - Remover defeito
router.delete("/:id", authMiddleware, deletarDefeito);

export default router;
