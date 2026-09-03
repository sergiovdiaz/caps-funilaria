//cap.http.js

import { apiGet, apiPost } from "./api.methods.js";

/**
 * Histórico agregado de CAP
 */
export function getCapHistory({ startDate, endDate }) {
  if (!startDate || !endDate) {
    throw new Error("startDate e endDate são obrigatórios");
  }

  return apiGet("/cap/history", {
    startDate,
    endDate,
  });
}

export async function createJustificativa(payload) {
  if (!payload) {
    throw new Error("Payload da justificativa não fornecido");
  }

  console.log("payload criação: ", payload);
  return apiPost("/cap/justificativa", payload);
}

export async function approveJustificativa(id, token) {
  if (!id) throw new Error("ID da justificativa não fornecido");
  console.log("Aprovando justificativa com ID:", id);

  return apiPost(`/cap/justificativa/${id}/aprovacao`, {}, token);
}

//  REQUEST CHANGES
export async function requestChangesJustificativa(id, payload, token) {
  if (!id) throw new Error("ID da justificativa não fornecido");

  return apiPost(`/cap/justificativa/${id}/alteracao`, payload, token);
}

export async function getCapListarJustificativasPendentes(filtros = {}) {
  console.log("Buscando justificativas pendentes...");

  const filtrosLimpos = Object.fromEntries(
    Object.entries(filtros).filter(
      ([_, v]) => v !== null && v !== undefined && v !== "",
    ),
  );

  const response = await apiGet(
    "/cap/justificativas/pendencias",
    filtrosLimpos,
  );

  return response?.data ?? {};
}

export async function getCapListarValidacoesPendentes(filtros = {}) {
  console.log("Buscando validações pendentes...");

  const filtrosLimpos = Object.fromEntries(
    Object.entries(filtros).filter(
      ([_, v]) => v !== null && v !== undefined && v !== "",
    ),
  );

  const response = await apiGet("/cap/validacao/pendencias", filtrosLimpos);

  return response?.data ?? {};
}

export async function getAlarmesDisponiveisAlocacao({
  linha,
  causa,
  ts_inicio,
  horas = 3,
}) {
  return apiGet("/cap/alarmes/disponiveis-para-alocacao", {
    linha,
    causa,
    ts_inicio,
    horas,
  });
}

/**
 * Lista de máquinas
 */
export function getCapListarMaquinas(filtros = {}) {
  console.log("buscando máquinas...");

  return apiGet("/cap/maquinas", filtros);
}

/**
 * Lista de mantenedores
 */
export function getCapListarMantenedores() {
  console.log("buscando mantenedores...");

  return apiGet("/cap/mantenedores");
}

/**
 * Busca justificativa por ID
 */
export async function getCapJustificativaById(id) {
  if (!id) {
    throw new Error("ID da justificativa não fornecido");
  }

  try {
    return await apiGet(`/cap/justificativa/${id}`);
  } catch (error) {
    if (error?.status === 404) {
      throw new Error("Justificativa não encontrada");
    }
    throw new Error("Erro ao buscar justificativa");
  }
}
