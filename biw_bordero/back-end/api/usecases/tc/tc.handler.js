// tc.handler.js
import { processTCMessage } from "./tc.service.js";
import { emitTCDataUpdate } from "./tc.emitter.js";
import * as tcService from "./tc.pgService.js";
import { successResponse, asyncHandler } from "../common/response.js";

export async function tcMessageHandler(msg) {
  if (!msg?.Line || !msg?.Maq) return;

  const line = msg.Line;

  try {
    // 1️⃣ processa e atualiza Redis
    await processTCMessage(msg);

    // 2️⃣ monta filtro
    const stations = [];

    if (msg.Maq === "ST") {
      // 🔹 só inclui se Maq for "ST"
      if (msg.ST) {
        stations.push({ st: msg.ST, maq: msg.Maq });
      } else {
        stations.push({ maq: msg.Maq });
      }
    }

    // 3️⃣ emite atualização apenas se tiver algo no array
    if (stations.length) {
      await emitTCDataUpdate({
        line,
        stations,
      });
    }
  } catch (err) {
    console.error("[TC Handler] Erro ao processar mensagem:", err.message);
  }
}

export const getTCHistory = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      line,
      st = null,
      maq = "ST",
      type = "processed",
    } = req.query;

    console.log("Solicitado:", req.query);

    if (!line || !startDate || !endDate) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios: line, startDate, endDate",
      });
    }

    let data;

    if (type === "raw") {
      data = await tcService.getHistoryTCRaw({
        line,
        startDate,
        endDate,
        st,
        maq,
      });
    } else {
      data = await tcService.getHistoryTC({
        line,
        startDate,
        endDate,
        st,
        maq,
      });
    }

    return res.status(200).json({
      success: true,
      mode: type,
      data,
    });
  } catch (error) {
    console.error("Erro ao buscar histórico de TC:", error);

    return res.status(500).json({
      error: "Erro interno ao buscar histórico de TC",
    });
  }
};

// =============================
// RELATÓRIO TC
// =============================


export const getTCRelatorio = asyncHandler(async (req, res) => {
  const data = await tcService.getTCRelatorio(); 

  res.json(successResponse(data));
});
