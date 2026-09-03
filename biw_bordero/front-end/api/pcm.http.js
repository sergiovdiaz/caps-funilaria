// /api/pcm.http.js
import { apiPost, apiGet } from "./api.methods";

export async function uploadPCM(formData, token) {
  return apiPost("/pcm/upload", formData, token);
}

// Busca a programação PCM de uma semana
export async function getPCMProgramacao({ ano, semana }) {
  return apiGet("/pcm/programacao", { ano, semana });
}
