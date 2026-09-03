import { apiPost, apiGet } from "./api.methods";

// =============================
// DASHBOARD
// =============================
export async function fetchDashboardGeral(filters) {
  return apiPost("/bordero/dashboardgeral", filters);
}

// =============================
// EVENTO DETALHE (opcional)
// =============================
export async function fetchEventoDetalhe(event_id) {
  return apiGet("/lossanalysis/evento", { event_id });
}
