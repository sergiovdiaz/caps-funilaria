import { apiGet } from "./api.methods.js";

/**
 * Histórico agregado de TC
 */
export function getTcHistory({
  line,
  startDate,
  endDate,
  st,
  maq,
  type = "processed",
}) {
  if (!line || !startDate || !endDate) {
    throw new Error("line, startDate e endDate são obrigatórios");
  }

  return apiGet("/tc/history", {
    line,
    startDate,
    endDate,
    st,
    maq,
    type,
  });
}

export function getTcRelatorio() {
  return apiGet("/tc/relatorio");
}
