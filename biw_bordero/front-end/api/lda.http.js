import { apiGet } from "./api.methods.js";

export function getLdaEventos() {
  return apiGet("/lda/eventos");
}

export function getLdaKpis(inicio, fim, turno = null) {
  const params = new URLSearchParams({
    inicio,
    fim,
  });

  if (turno && turno !== "TODOS") {
    params.append("turno", turno);
  }

  return apiGet(`/lda/kpis?${params.toString()}`);
}