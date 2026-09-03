// cap.routes.js
import express from "express";
import * as capHandler from "../../../usecases/cap/cap.handler.js";
import { validarAreaDaJustificativa } from "../../../middlewares/area.middleware.js";
import { authMiddleware } from "../../../middlewares/auth.js";
const router = express.Router();

// =============================
// JUSTIFICATIVAS
// =============================
router.post("/justificativa", authMiddleware, capHandler.criarJustificativa);
router.get("/justificativa/:id", capHandler.getJustificativaById);

const logRequest = (req, res, next) => {
  next();
};

router.post(
  "/justificativa/:id/aprovacao",
  logRequest,
  authMiddleware,
  validarAreaDaJustificativa(),
  capHandler.aprovacaoJustificativa,
);

router.post(
  "/justificativa/:id/alteracao",
  authMiddleware,
  validarAreaDaJustificativa(),
  capHandler.alteracaoJustificativa,
);

// =============================
// LISTAGENS
// =============================
router.get("/justificativas", capHandler.listarJustificativas);

router.get("/justificativas/pendencias", capHandler.listarJustificativasPendencias);

router.get("/validacao/pendencias", capHandler.listarValidacaoPendencias);

router.get("/maquinas", capHandler.listarMaquinas);
router.get("/mantenedores", capHandler.listarMantenedores);

router.get("/alarmes/disponiveis-para-alocacao", capHandler.listarAlarmesDisponiveisAlocacao);





// =============================
// CAP DATA
// =============================
router.get("/alarms", capHandler.getAlarms);
router.get("/producao", capHandler.getProducao);
router.get("/history", capHandler.getHistorico);

export default router;
 