// defeitos.http.js
import { apiGet, apiPost } from "./api.methods";

// =============================
// DEFEITOS - CRUD Básico
// =============================

/**
 * Lista todos os defeitos com filtros opcionais
 * @param {Object} params - Filtros
 * @param {string} params.data - Data no formato YYYY-MM-DD
 * @param {number} params.turno - Número do turno (1, 2, 3)
 * @param {string} params.modelo - Código do modelo (ex: 598, 291)
 * @param {string} params.visao - Visão (dx, sx, frontal, traseira)
 * @param {string} params.area - Área do defeito (portaTraseira, parachoque, etc.)
 * @param {number} params.quadrante - Número do quadrante (1, 2, 3, 4, 5, 6)
 * @param {string} params.defeito - Descrição do defeito
 * @param {string} params.dataInicio - Data inicial para filtro
 * @param {string} params.dataFim - Data final para filtro
 * @returns {Promise<Object>} Lista de defeitos
 */
export async function fetchDefeitos(params = {}) {
  return apiGet("/defeitos", params);
}

/**
 * Busca um defeito específico por ID
 * @param {string|number} id - ID do defeito
 * @returns {Promise<Object>} Dados do defeito
 */
export async function fetchDefeitoById(id) {
  return apiGet(`/defeitos/${id}`);
}

/**
 * Cria um novo registro de defeito
 * @param {Object} data - Dados do defeito
 * @param {string} data.data - Data no formato YYYY-MM-DD
 * @param {number} data.turno - Número do turno (1, 2, 3)
 * @param {string} data.modelo - Código do modelo
 * @param {string} data.visao - Visão (dx, sx, frontal, traseira)
 * @param {string} data.area - Área do defeito
 * @param {number} data.numeroQuadrante - Número do quadrante
 * @param {string} data.defeito - Descrição do defeito
 * @param {string} [data.observacoes] - Observações adicionais
 * @param {string} [data.usuario] - Usuário que registrou
 * @returns {Promise<Object>} Defeito criado
 */
export async function createDefeito(data) {
  // Validações básicas antes de enviar
  if (!data.data) throw new Error("Data é obrigatória");
  if (!data.turno) throw new Error("Turno é obrigatório");
  if (!data.modelo) throw new Error("Modelo é obrigatório");
  if (!data.visao) throw new Error("Visão é obrigatória");
  if (!data.area) throw new Error("Área é obrigatória");
  if (!data.numeroQuadrante)
    throw new Error("Número do quadrante é obrigatório");
  if (!data.defeito) throw new Error("Defeito é obrigatório");

  // Converte turno para número se for string
  const payload = {
    ...data,
    turno: Number(data.turno),
    numeroQuadrante: Number(data.numeroQuadrante),
    registradoEm: data.registradoEm || new Date().toISOString(),
  };

  return apiPost("/defeitos", payload);
}

/**
 * Atualiza um defeito existente
 * @param {string|number} id - ID do defeito
 * @param {Object} data - Dados para atualizar
 * @returns {Promise<Object>} Defeito atualizado
 */
export async function updateDefeito(id, data) {
  return apiPost(`/defeitos/${id}`, data);
}

/**
 * Remove um defeito
 * @param {string|number} id - ID do defeito
 * @returns {Promise<Object>} Resultado da operação
 */
export async function deleteDefeito(id) {
  return apiPost(`/defeitos/${id}/delete`);
}

// =============================
// DEFEITOS - Relatórios e Estatísticas
// =============================

/**
 * Busca estatísticas de defeitos por período
 * @param {Object} params
 * @param {string} params.dataInicio - Data inicial
 * @param {string} params.dataFim - Data final
 * @param {string} params.modelo - Filtrar por modelo
 * @returns {Promise<Object>} Estatísticas
 */
export async function fetchDefeitosStats(params = {}) {
  return apiGet("/defeitos/stats", params);
}

/**
 * Busca defeitos por modelo
 * @param {string} modelo - Código do modelo
 * @param {Object} params - Filtros adicionais
 * @returns {Promise<Object>} Defeitos do modelo
 */
export async function fetchDefeitosByModelo(modelo, params = {}) {
  return apiGet(`/defeitos/modelo/${modelo}`, params);
}

/**
 * Busca defeitos por quadrante
 * @param {string} visao - Visão (dx, sx, frontal, traseira)
 * @param {number} quadrante - Número do quadrante
 * @param {Object} params - Filtros adicionais
 * @returns {Promise<Object>} Defeitos do quadrante
 */
export async function fetchDefeitosByQuadrante(visao, quadrante, params = {}) {
  return apiGet(`/defeitos/quadrante/${visao}/${quadrante}`, params);
}

// =============================
// DEFEITOS - Exportação
// =============================

/**
 * Exporta defeitos para CSV
 * @param {Object} params - Filtros
 * @param {string} params.dataInicio - Data inicial
 * @param {string} params.dataFim - Data final
 * @param {string} params.modelo - Filtrar por modelo
 * @returns {Promise<Blob>} Arquivo CSV
 */
export async function exportDefeitosCSV(params = {}) {
  return apiGet("/defeitos/export/csv", params);
}

/**
 * Exporta defeitos para Excel
 * @param {Object} params - Filtros
 * @returns {Promise<Blob>} Arquivo Excel
 */
export async function exportDefeitosExcel(params = {}) {
  return apiGet("/defeitos/export/excel", params);
}

// =============================
// DEFEITOS - Dashboard
// =============================

/**
 * Busca dados para o dashboard de defeitos
 * @param {Object} params
 * @param {string} params.periodo - Período (hoje, semana, mes)
 * @param {string} params.modelo - Filtrar por modelo
 * @returns {Promise<Object>} Dados do dashboard
 */
export async function fetchDefeitosDashboard(params = {}) {
  return apiGet("/defeitos/dashboard", params);
}

// =============================
// DEFEITOS - Templates e Sugestões
// =============================

/**
 * Busca defeitos comuns por modelo e área
 * @param {string} modelo - Código do modelo
 * @param {string} area - Área específica
 * @returns {Promise<Object>} Lista de defeitos comuns
 */
export async function fetchDefeitosComuns(modelo, area) {
  return apiGet(`/defeitos/comuns/${modelo}`, { area });
}

/**
 * Busca áreas disponíveis por modelo
 * @param {string} modelo - Código do modelo
 * @returns {Promise<Object>} Lista de áreas
 */
export async function fetchAreasByModelo(modelo) {
  return apiGet(`/defeitos/areas/${modelo}`);
}

// =============================
// DEFEITOS - Integração com Machine Ledger
// =============================

/**
 * Busca defeitos relacionados a uma máquina específica
 * @param {string} codigoMaquina - Código da máquina
 * @param {Object} params - Filtros
 * @returns {Promise<Object>} Defeitos da máquina
 */
export async function fetchDefeitosByMaquina(codigoMaquina, params = {}) {
  return apiGet(`/defeitos/maquina/${codigoMaquina}`, params);
}

// =============================
// DEFEITOS - Utilitários para o Frontend
// =============================

/**
 * Formata os dados do quadrante para enviar ao backend
 * @param {Object} quadrantData - Dados do quadrante selecionado
 * @param {string} quadrantData.visao - Visão (dx, sx, frontal, traseira)
 * @param {string} quadrantData.area - Área
 * @param {number} quadrantData.numero - Número do quadrante
 * @param {string} quadrantData.id - ID completo do quadrante
 * @returns {Object} Dados formatados
 */
export function formatQuadrantData(quadrantData) {
  if (!quadrantData) return null;

  return {
    visao: quadrantData.visao,
    area: quadrantData.area,
    numeroQuadrante: quadrantData.numero,
    quadranteId: quadrantData.id,
    visaoNome: quadrantData.visaoNome || quadrantData.visao,
    displayName:
      quadrantData.displayName ||
      `${quadrantData.visao}_${quadrantData.area}_q${quadrantData.numero}`,
  };
}

/**
 * Valida os dados do defeito antes de enviar
 * @param {Object} data - Dados do defeito
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateDefeitoData(data) {
  const errors = [];

  if (!data.data) errors.push("Data é obrigatória");
  if (!data.turno) errors.push("Turno é obrigatório");
  if (!data.modelo) errors.push("Modelo é obrigatório");
  if (!data.visao) errors.push("Visão é obrigatória");
  if (!data.area) errors.push("Área é obrigatória");
  if (!data.numeroQuadrante) errors.push("Número do quadrante é obrigatório");
  if (!data.defeito || data.defeito.trim() === "")
    errors.push("Defeito é obrigatório");

  // Validações adicionais
  if (data.turno && ![1, 2, 3].includes(Number(data.turno))) {
    errors.push("Turno deve ser 1, 2 ou 3");
  }

  if (data.numeroQuadrante && isNaN(Number(data.numeroQuadrante))) {
    errors.push("Número do quadrante deve ser um número");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Exportações padrão
export default {
  fetchDefeitos,
  fetchDefeitoById,
  createDefeito,
  updateDefeito,
  deleteDefeito,
  fetchDefeitosStats,
  fetchDefeitosByModelo,
  fetchDefeitosByQuadrante,
  exportDefeitosCSV,
  exportDefeitosExcel,
  fetchDefeitosDashboard,
  fetchDefeitosComuns,
  fetchAreasByModelo,
  fetchDefeitosByMaquina,
  formatQuadrantData,
  validateDefeitoData,
};
