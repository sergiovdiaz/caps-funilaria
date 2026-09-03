//machineledger.routes.js
import express from "express";
import { authMiddleware } from "../../../middlewares/auth.js";
import { areaMiddleware } from "../../../middlewares/area.middleware.js";
import {
  getUtes,
  getLinhas,
  getOperacoes,
  getTipos,
  getMaquinas,
  getComponentes,
  getSearchResults,
  getFullTree,
  criarReserva,
  consultarStatusReserva,
} from "../../../usecases/machineledger/machineledger.handler.js";

const router = express.Router();

// =============================
// GET /machineledger/utes
// =============================
router.get("/utes", getUtes);

// =============================
// GET /machineledger/linhas?ute=
// =============================
router.get("/linhas", getLinhas);

// =============================
// GET /machineledger/operacoes?linha=
// =============================
router.get("/operacoes", getOperacoes);

// =============================
// GET /machineledger/tipologias?linha=&operacao=
// =============================
router.get("/tipologia", getTipos);

// =============================
// GET /machineledger/maquinas?linha=&operacao=&tipo=
// =============================
router.get("/maquinas", getMaquinas);

// =============================
// GET /machineledger/componentes?maquina=
// =============================
router.get("/componentes", getComponentes);

// =============================
// GET /machineledger/search?query=texto
// =============================
router.get("/search", getSearchResults);

// =============================
// GET /machineledger/tree
// =============================
router.get("/tree", getFullTree);

// POST /machineledger/reserva
// Cria uma nova reserva
// =============================
router.post("/reserva", authMiddleware, criarReserva);

// =============================
// GET /machineledger/reserva/:id/status
// Consulta status da reserva
// =============================
router.get("/reserva/:id/status", authMiddleware, consultarStatusReserva);

export default router;
