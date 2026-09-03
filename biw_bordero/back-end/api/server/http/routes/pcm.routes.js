//pcmRoutes.js

import express from "express";
import multer from "multer";
import { uploadPCM, getPCM } from "../../../usecases/pcm/pcm.handler.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { areaMiddleware } from "../../../middlewares/area.middleware.js";

const router = express.Router();
const upload = multer();

// =============================
// POST /pcm/upload
// =============================
router.post(
  "/upload",
  authMiddleware,
  areaMiddleware(["MANUTENÇÃO"]),
  upload.single("file"),
  uploadPCM,
);

// =============================
// GET /pcm/programacao
// =============================
router.get("/programacao", getPCM);

export default router;
