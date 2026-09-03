import * as geralDashboardService from "./geral.pgService.js";
import { successResponse, asyncHandler } from "../../common/response.js";

// =============================
// DASHBOARD
// =============================
export const getLossDashboard = asyncHandler(async (req, res) => {
  const data = await geralDashboardService.getDashboard({
    ...req.body,
  });

  res.json(successResponse(data));
});

// =============================
// EVENTO
// =============================
// export const getEventoDetalhe = asyncHandler(async (req, res) => {
//   const { event_id } = req.query;

//   const data = await lossService.getEventoDetalhe(event_id);

//   res.json(successResponse(data));
// });
