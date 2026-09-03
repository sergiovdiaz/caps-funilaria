import * as capService from "./cap.service.js";
import {
  successResponse,
  errorResponse,
  asyncHandler,
  requireParams,
} from "../common/response.js";

// =============================
// ALARMS
// =============================
export const getAlarms = asyncHandler(async (req, res) => {
  const { line, start, end } = req.query;

  if (
    requireParams(res, [
      { name: "line", value: line },
      { name: "start", value: start },
      { name: "end", value: end },
    ])
  )
    return;

  const data = await capService.getAlarms({
    line,
    start,
    end,
  });

  res.json(successResponse(data));
});

// =============================
// PRODUÇÃO
// =============================
export const getProducao = asyncHandler(async (req, res) => {
  const { line, date } = req.query;

  if (
    requireParams(res, [
      { name: "line", value: line },
      { name: "date", value: date },
    ])
  )
    return;

  const data = await capService.getProducao({
    line,
    date,
  });

  res.json(successResponse(data));
});

// =============================
// JUSTIFICATIVA
// =============================
export async function criarJustificativa(req, res) {
  try {
    const payload = req.body;

    const matricula = req.user.matricula;

    const result = await capService.criarJustificativa({
      ...payload,
      matricula,
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar justificativa" });
  }
}

export const getJustificativaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (requireParams(res, [{ name: "id", value: id }])) return;

  const data = await capService.getJustificativaById({
    id,
  });

  res.json(successResponse(data));
});

export const aprovacaoJustificativa = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const idJustificativa = req.justificativa.id;
    const user = req.user;

    const result = await capService.approve({
      id: idJustificativa,
      user,
    });

    return res.json(successResponse(result));
  } catch (err) {
    console.error("Erro ao aprovar justificativa:", err);

    return res.status(400).json({
      success: false,
      error: err.message || "Erro ao aprovar justificativa",
    });
  }
});

export const alteracaoJustificativa = asyncHandler(async (req, res) => {
  try {
    // console.log(res.req.body);

    const justificativa = req.justificativa;
    const user = req.user;
    const payload = req.body;

    // console.log(justificativa, user, payload);

    const result = await capService.requestChanges({
      id: justificativa.id,
      user,
      payload,
    });

    return res.json(successResponse(result));
  } catch (err) {
    console.error("Erro ao solicitar alteração:", err);

    return res.status(400).json({
      success: false,
      error: err.message || "Erro ao solicitar alteração",
    });
  }
});

// =============================
// LISTAGENS
// =============================
export const listarJustificativas = asyncHandler(async (req, res) => {
  const data = await capService.listarJustificativas({
    ...req.query,
  });
  // console.log("Data retornada pelo service:", data);

  res.json(successResponse(data));
});

export const listarMantenedores = asyncHandler(async (req, res) => {
  const data = await capService.listarMantenedores();
  // console.log("Data retornada pelo service:", data);

  res.json(successResponse(data));
});

export const listarJustificativasPendencias = asyncHandler(async (req, res) => {
  const data = await capService.listarPendencias({
    ...req.query,
  });

  res.json(successResponse(data));
});

export const listarValidacaoPendencias = asyncHandler(async (req, res) => {
  const data = await capService.listarValidacaoPendencias({
    ...req.query,
  });

  res.json(successResponse(data));
});

export const listarMaquinas = asyncHandler(async (req, res) => {
  const data = await capService.listarMaquinas({
    ...req.query,
  });

  res.json(successResponse(data));
});

export const listarAlarmesDisponiveisAlocacao = asyncHandler(
  async (req, res) => {
    const { linha, causa, ts_inicio, horas } = req.query;

    if (!linha || !causa) {
      return res.status(400).json({
        ok: false,
        message: "linha e causa são obrigatórios",
      });
    }

    const data = await capService.listarAlarmesDisponiveisAlocacao({
      linha,
      causa,
      ts_inicio,
      horas,
    });

    res.json(successResponse(data));
  },
);

// =============================
// HISTÓRICO
// =============================
export const getHistorico = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (
    requireParams(res, [
      { name: "startDate", value: startDate },
      { name: "endDate", value: endDate },
    ])
  )
    return;

  const data = await capService.getHistorico({
    start: startDate,
    end: endDate,
  });

  res.json(successResponse(data));
});
