import { getEventosLDA, getKpiLDADashboard } from "./lda.pgService.js";
import {
  successResponse,
  errorResponse,
  asyncHandler,
  requireParams,
  requireParams2,
} from "../common/response.js";

export const eventosLDAHandler = asyncHandler(async (req, res) => {
  const data = await getEventosLDA();
  res.json(successResponse(data));
});

export const kpiLDAHandler = asyncHandler(async (req, res) => {
  const { inicio, fim, turno } = req.query;

  const hasError = requireParams2(req, res, ["inicio", "fim"]);
  if (hasError) return;

  const kpis = await getKpiLDADashboard({ inicio, fim });

  return res.json(successResponse(kpis));
});
