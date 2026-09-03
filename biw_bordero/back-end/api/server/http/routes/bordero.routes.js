// lossanalysis.routes.js
import express from "express";
import { getLossDashboard } from "../../../usecases/bordero/geral/geral.handler.js";

const router = express.Router();

// =============================
// POST /lossanalysis/dashboard
// =============================
router.post("/dashboardgeral", getLossDashboard);

// =============================
// GET /lossanalysis/evento?event_id=
// (opcional - detalhe do evento)
// =============================
// router.get("/evento",  getTabelaDetalheEvento);

export default router;
