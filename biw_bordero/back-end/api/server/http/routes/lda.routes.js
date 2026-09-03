import express from "express";
import {
  eventosLDAHandler,
  kpiLDAHandler,
} from "../../../usecases/lda/lda.handler.js";

const router = express.Router();

// =============================
// GET /lda/eventos
// =============================
router.get("/eventos", eventosLDAHandler);

router.get("/kpis", kpiLDAHandler);

export default router;
