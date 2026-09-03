//machineledger.http.js
import { apiGet, apiPost } from "./api.methods";

// =============================
// UTEs
// =============================
export async function fetchUtes() {
  console.log("solicitando ute");
  return apiGet("/machineledger/utes");
}

// =============================
// Linhas
// =============================
export async function fetchLinhas(ute) {
  return apiGet("/machineledger/linhas", { ute });
}

// =============================
// Operações
// =============================
export async function fetchOperacoes(linha) {
  return apiGet("/machineledger/operacoes", { linha });
}

// =============================
// Tipos de Máquina
// =============================
export async function fetchTipologia(linha, operacao) {
  return apiGet("/machineledger/tipologia", {
    linha,
    operacao,
  });
}

// =============================
// Máquinas
// =============================
export async function fetchMaquinas(linha, operacao, tipoMaquina) {
  return apiGet("/machineledger/maquinas", {
    linha,
    operacao,
    tipoMaquina,
  });
}

// =============================
// Componentes
// =============================
export async function fetchComponentes(maquina) {
  return apiGet("/machineledger/componentes", { maquina });
}

// =============================
// Search global
// =============================
export async function searchMachineLedger(query) {
  return apiGet("/machineledger/search", { q: query });
}

// =============================
// Tree
// =============================
export async function fetchTree() {
  return apiGet("/machineledger/tree");
}

// =============================
// RESERVA - Criar reserva
// =============================
/**
 * Cria uma nova reserva de materiais
 * @param {Object} params - Parâmetros da reserva
 * @param {string} params.codigoMaquina - Código da máquina
 * @param {Array} params.materiais - Lista de materiais [{ codigo, quantidade }]
 * @param {string} params.descricaoOS - Descrição da ordem de serviço
 * @param {string} params.descricaoAtividade - Descrição da atividade
 * @param {boolean} params.aguardarSAP - Aguardar integração SAP (padrão: true)
 * @param {number} params.maxAttempts - Máximo de tentativas (padrão: 8)
 * @param {number} params.intervalSeconds - Intervalo entre tentativas (padrão: 3)
 * @returns {Promise<Object>} Resultado da reserva
 */
export async function createReserva({
  codigoMaquina,
  materiais,
  descricaoOS,
  descricaoAtividade,
  aguardarSAP = true,
  maxAttempts = 8,
  intervalSeconds = 3,
}) {
  const body = {
    codigoMaquina,
    materiais,
    descricaoOS,
    descricaoAtividade,
    aguardarSAP,
    maxAttempts,
    intervalSeconds,
  };

  return apiPost("/machineledger/reserva", body);
}

// =============================
// RESERVA - Consultar status
// =============================
/**
 * Consulta o status de uma reserva
 * @param {string} id - Transaction ID ou Reservation ID
 * @param {Object} options - Opções adicionais
 * @param {number} options.orderId - ID da ordem (opcional)
 * @returns {Promise<Object>} Status da reserva
 */
export async function getReservaStatus(id, options = {}) {
  const params = new URLSearchParams();
  if (options.orderId) {
    params.append("orderId", options.orderId);
  }

  const queryString = params.toString();
  const url = queryString
    ? `/machineledger/reserva/${id}/status?${queryString}`
    : `/machineledger/reserva/${id}/status`;

  return apiGet(url);
}

// =============================
// RESERVA - Monitorar status em tempo real (polling)
// =============================
/**
 * Monitora o status de uma reserva com polling
 * @param {string} id - Transaction ID
 * @param {Object} options - Opções de monitoramento
 * @param {number} options.interval - Intervalo entre consultas (ms) (padrão: 3000)
 * @param {number} options.maxAttempts - Máximo de tentativas (padrão: 20)
 * @param {Function} options.onStatusChange - Callback quando o status muda
 * @param {Function} options.onComplete - Callback quando a reserva é concluída
 * @param {Function} options.onError - Callback em caso de erro
 * @returns {Object} { stop: Function } - Função para parar o monitoramento
 */
export function monitorReservaStatus(id, options = {}) {
  const {
    interval = 3000,
    maxAttempts = 20,
    onStatusChange,
    onComplete,
    onError,
  } = options;

  let attempts = 0;
  let intervalId = null;
  let lastStatus = null;

  const checkStatus = async () => {
    attempts++;

    try {
      const result = await getReservaStatus(id);

      if (result.success && result.data) {
        const currentStatus = result.data.status;

        // Notifica mudança de status
        if (currentStatus !== lastStatus && onStatusChange) {
          onStatusChange(result.data);
        }

        lastStatus = currentStatus;

        // Se concluído, para o monitoramento
        if (currentStatus === "completed") {
          stop();
          if (onComplete) onComplete(result.data);
        }

        // Se atingiu o limite de tentativas
        if (attempts >= maxAttempts) {
          stop();
          if (onError) onError(new Error("Tempo limite excedido"));
        }
      }
    } catch (error) {
      console.error(`Erro ao monitorar reserva ${id}:`, error);
      if (onError) onError(error);
      stop();
    }
  };

  const start = () => {
    // Primeira verificação imediata
    checkStatus();
    // Depois verifica no intervalo
    intervalId = setInterval(checkStatus, interval);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return { start, stop };
}
