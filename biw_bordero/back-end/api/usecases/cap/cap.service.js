// cap.service.js
import * as capDB from "./cap.pgService.js";
import {
  buildProducaoChart,
  buildJustificativasList,
  buildJustificativa,
  buildValidacaoPendencias,
  buildAlarmesDisponiveis,
} from "./cap.builders.js";

import { STATUS, validateTransition } from "./utils/cap.jusStatus.js";
// =============================
// PRODUÇÃO
// =============================
export async function getProducao({ line, date }) {
  const dados = await capDB.getProducaoRaw(line, date);

  return buildProducaoChart(dados);
}

// =============================
// LISTAGENS
// =============================

export async function listarJustificativas(filtros) {
  // console.log("Listando justificativas com filtros:", filtros);
  const rows = await capDB.getlistarJustificativas(filtros);
  // console.log("Justificativas encontradas:", rows);

  return buildJustificativasList(rows);
}

export async function listarPendencias(filtros) {
  return await capDB.listarJustificativasPendencias(filtros);
}

export async function listarValidacaoPendencias(filtros = {}) {
  const justificativas = await capDB.listarValidacaoPendencias(filtros);
  const responsaveisDim = await capDB.getResponsaveis();

  return buildValidacaoPendencias(justificativas, responsaveisDim);
}

export async function listarMaquinas(filtros) {
  return await capDB.getMaquinas(filtros);
}

export async function listarMantenedores() {
  return await capDB.getMantenedores();
}

export async function listarAlarmesDisponiveisAlocacao({
  linha,
  causa,
  ts_inicio,
  horas = 3,
}) {
  const result = await capDB.getDisponivelAlocacao({
    linha,
    causaRaiz: causa,
    ts_inicio,
    horas: Number(horas),
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return buildAlarmesDisponiveis(result.data);
}

// =============================
// HISTÓRICO
// =============================
export async function getHistorico({ start, end }) {
  return await capDB.listarHistoricoJustificativas(start, end);
}

// =============================
// ALARMS
// =============================
export async function getAlarms({ line, start, end }) {
  return await capDB.getCapAlarms(line, [start, end]);
}

// =============================
// JUSTIFICATIVA
// =============================

export async function getJustificativaById({ id }) {
  const rows = await capDB.getJustificativaById(id);

  // console.log("Rows retornadas do banco para justificativa:", rows);
  return rows;
}

export async function criarJustificativa(data) {
  return await capDB.criarJustificativa(data);
}

export async function approve({ id, user }) {
  // console.log("Aprovando justificativa:", id);

  //  1. buscar estado REAL no banco
  const justificativa = await capDB.getJustificativaStatus(id);

  if (!justificativa) {
    throw new Error("Justificativa não encontrada");
  }

  const from = justificativa.idstatus;
  let to;

  if (from === STATUS.EM_REVISAO) {
    to = STATUS.PENDENTE_VALIDACAO;
  } else if (from === STATUS.PENDENTE_VALIDACAO) {
    to = STATUS.FINALIZADA;
  } else {
    throw new Error("Não é possível aprovar essa justificativa");
  }

  // console.log("🔄 Transição:", from, "→", to);

  // 2. validar transição
  validateTransition(from, to);

  // 3. validar permissão
  if (user.area !== justificativa.validador) {
    throw new Error("Sem permissão para aprovar");
  }

  // 4. executar no banco
  const result = await capDB.approve({
    justificativaId: id,
    userId: user.matricula,
    newStatus: to,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}

export async function requestChanges({ id, user, payload }) {
  // console.log("Payload recebido para requestChanges:", payload);

  const justificativa = await capDB.getJustificativaStatus(id);
  // console.log("Justificativa atual para requestChanges:", justificativa);

  //  1. comentário obrigatório
  if (!payload.comentario) {
    throw new Error("Comentário é obrigatório");
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("Nenhuma alteração detectada");
  }

  const result = await capDB.requestChanges({
    justificativa,
    userId: user.matricula,
    changes: payload,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}
