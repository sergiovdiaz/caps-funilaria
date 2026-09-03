import express from "express";
import { statusMedicaoHandler } from "../../../usecases/weldingreport/welding.handler.js";

const router = express.Router();

// =============================
// GET /tc/history
// =============================
router.get("/clamps/status", statusMedicaoHandler);

export default router;
