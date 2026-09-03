// machineledger.handler.js
import * as mlService from "./machineledger.service.js";
import {
  successResponse,
  errorResponse,
  asyncHandler,
} from "../common/response.js";

import {
  createReserva,
  getReservaStatus,
} from "../../conectores/manusis/reserva/manusis.reserva.js";

// =============================
// UTEs
// =============================
export const getUtes = asyncHandler(async (req, res) => {
  const data = await mlService.fetchUtes();
  res.json(successResponse(data));
});

// =============================
// Linhas
// =============================
export const getLinhas = asyncHandler(async (req, res) => {
  const { ute } = req.query;

  if (!ute) {
    return res
      .status(400)
      .json(errorResponse("Parâmetro ute é obrigatório", "BAD_REQUEST"));
  }

  const data = await mlService.fetchLinhas(ute);

  res.json(successResponse(data));
});

// =============================
// Operações
// =============================
export const getOperacoes = asyncHandler(async (req, res) => {
  const { linha } = req.query;

  if (!linha) {
    return res
      .status(400)
      .json(errorResponse("Parâmetro linha é obrigatório", "BAD_REQUEST"));
  }

  const data = await mlService.fetchOperacoes(linha);

  res.json(successResponse(data));
});

// =============================
// Tipos de Máquina
// =============================
export const getTipos = asyncHandler(async (req, res) => {
  const { linha, operacao } = req.query;

  if (!linha || !operacao) {
    return res
      .status(400)
      .json(
        errorResponse(
          "Parâmetros linha e operacao são obrigatórios",
          "BAD_REQUEST",
        ),
      );
  }

  const data = await mlService.fetchTipos(linha, operacao);

  res.json(successResponse(data));
});

// =============================
// Máquinas
// =============================
export const getMaquinas = asyncHandler(async (req, res) => {
  const { linha, operacao, tipoMaquina } = req.query;

  if (!linha || !operacao || !tipoMaquina) {
    return res
      .status(400)
      .json(
        errorResponse(
          "Parâmetros linha, operacao e tipoMaquina são obrigatórios",
          "BAD_REQUEST",
        ),
      );
  }

  const data = await mlService.fetchMaquinas(linha, operacao, tipoMaquina);

  res.json(successResponse(data));
});

// =============================
// Componentes
// =============================
export const getComponentes = asyncHandler(async (req, res) => {
  const { maquina } = req.query;

  if (!maquina) {
    return res
      .status(400)
      .json(errorResponse("Parâmetro maquina é obrigatório", "BAD_REQUEST"));
  }

  const data = await mlService.fetchComponentes(maquina);

  res.json(successResponse(data));
});

// =============================
// Search global
// =============================
export const getSearchResults = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res
      .status(400)
      .json(errorResponse("Parâmetro query é obrigatório", "BAD_REQUEST"));
  }

  const results = await mlService.searchMachineLedger(query);

  res.json(successResponse(results));
});

// =============================
// TREE VIEW
// =============================
export const getFullTree = asyncHandler(async (req, res) => {
  const data = await mlService.fetchTreeView();
  res.json(successResponse(data));
});

// =============================
// RESERVA - CRIAR
// =============================
// =============================
export const criarReserva = asyncHandler(async (req, res) => {
  const {
    codigoMaquina,
    materiais,
    descricaoOS,
    descricaoAtividade,
    aguardarSAP = true,
    maxAttempts = 8,
    intervalSeconds = 3,
  } = req.body;

  // Validações
  if (!codigoMaquina) {
    return res
      .status(400)
      .json(
        errorResponse("Parâmetro codigoMaquina é obrigatório", "BAD_REQUEST"),
      );
  }

  if (!materiais || !Array.isArray(materiais) || materiais.length === 0) {
    return res
      .status(400)
      .json(
        errorResponse(
          "Parâmetro materiais é obrigatório e deve ser um array não vazio",
          "BAD_REQUEST",
        ),
      );
  }

  // Valida cada material
  for (const material of materiais) {
    if (!material.codigo) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Cada material deve ter o campo 'codigo'",
            "BAD_REQUEST",
          ),
        );
    }
    if (material.quantidade && typeof material.quantidade !== "number") {
      return res
        .status(400)
        .json(
          errorResponse(
            "O campo 'quantidade' deve ser um número",
            "BAD_REQUEST",
          ),
        );
    }
  }

  const resultado = await createReserva({
    codigoMaquina,
    materiais,
    descricaoOS,
    descricaoAtividade,
    aguardarSAP,
    maxAttempts,
    intervalSeconds,
  });

  // ✅ Verifica se é erro (quando tem a propriedade 'success' e é false)
  if (resultado && resultado.success === false) {
    return res
      .status(500)
      .json(errorResponse(resultado.message, "RESERVA_ERROR"));
  }

  console.log("resultado é: ", resultado);

  // ✅ resultado NÃO tem o campo 'success' (apenas dados)
  res.json(successResponse(resultado));
});

// =============================
// RESERVA - CONSULTAR STATUS
// =============================
export const consultarStatusReserva = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orderId } = req.query;

  if (!id) {
    return res
      .status(400)
      .json(errorResponse("Parâmetro id é obrigatório", "BAD_REQUEST"));
  }

  // ✅ A função getReservaStatus espera req, res
  // Mas seu controller está chamando de forma diferente
  // Vamos ajustar a chamada

  // Opção 1: Se getReservaStatus espera req, res
  // await getReservaStatus(req, res);

  // Opção 2: Vamos criar uma versão que retorna dados
  // Por enquanto, vou assumir que você vai modificar o getReservaStatus
  // para retornar os dados diretamente

  const resultado = await consultarStatusReservaPorId(id, orderId);

  if (!resultado.success) {
    return res
      .status(404)
      .json(errorResponse(resultado.message, "STATUS_NOT_FOUND"));
  }

  // Remove o campo success do resultado
  const { success, ...dados } = resultado;
  res.json(successResponse(dados));
});

// Função auxiliar para consultar status (se precisar)
async function consultarStatusReservaPorId(id, orderId) {
  try {
    const statusKey = `reserva:status:${id}`;
    const cachedStatus = await redisService.get(statusKey);

    if (cachedStatus) {
      return {
        success: true,
        ...JSON.parse(cachedStatus),
      };
    }

    if (orderId) {
      const resultado = await consultarReservaPorId(id, parseInt(orderId));
      const reservaInfo = extrairNumeroReservaPrincipal(
        resultado.reservationNumber,
      );

      return {
        success: true,
        reservationNumber: resultado.reservationNumber,
        numeroReserva: reservaInfo?.numeroReserva,
        sequencialItem: reservaInfo?.sequencialItem,
        isIntegrated: resultado.isIntegrated,
        hasDash: resultado.hasDash,
      };
    }

    return {
      success: false,
      message: "Status não encontrado",
    };
  } catch (error) {
    console.error("❌ Erro ao consultar status:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}
