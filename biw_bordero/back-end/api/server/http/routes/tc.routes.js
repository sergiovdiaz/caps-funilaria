import express from "express";
import {
  getTCHistory,
  getTCRelatorio,
} from "../../../usecases/tc/tc.handler.js";

const router = express.Router();

// =============================
// GET /tc/history
// =============================
router.get("/history", getTCHistory);

router.get("/relatorio", getTCRelatorio);

export default router;
