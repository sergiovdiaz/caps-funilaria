import { getStatusMedicao } from "./welding.pgService.js";
import {
  successResponse,
  errorResponse,
  asyncHandler,
  requireParams,
} from "../common/response.js";

export const statusMedicaoHandler = asyncHandler(async (req, res) => {
  const data = await getStatusMedicao();
  res.json(successResponse(data));
});
