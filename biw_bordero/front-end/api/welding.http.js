import { apiGet } from "./api.methods.js";

export function getStatusMedicao() {
  return apiGet("/welding/clamps/status");
}
