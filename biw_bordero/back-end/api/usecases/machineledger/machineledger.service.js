//machineledger.service.js
import { pool } from "../../postgreConnect.js";
import { pgQueries } from "./machineledger.pgQueries.js";
import { manusisMachineledger } from "../../conectores/manusis/manusis.router.js";
// import * as pgService from "./machineledger.pgService.js";
import { extractCodigosSAP } from "./utils/array.js";
import {
  mapMateriaisByCodigo,
  addComponenteEstoque,
  mapRow,
  mapToOption,
  buildMachineTree,
} from "./machineledger.mapper.js";

async function runQuery(query, params = [], context = "") {
  try {
    const start = Date.now();

    const { rows } = await pool.query(query, params);

    const duration = Date.now() - start;

    console.log(`✅ ${context} | ${duration}ms | rows: ${rows.length}`);

    return rows.map(mapRow);
  } catch (err) {
    console.error(`❌ ERRO em ${context}`);
    console.error("Query:", query);
    console.error("Params:", params);
    console.error(err);

    throw new Error(`Erro ao executar ${context}`);
  }
}

// =============================
// UTEs
// =============================
export async function fetchUtes() {
  const rows = await runQuery(pgQueries.selectUtes, [], "fetchUtes");

  return rows.map((r) =>
    mapToOption({
      id: r.ute,
      label: `UTE ${r.ute}`,
      count: r.count,
      countType: r.countType,
    }),
  );
}

// =============================
// Linhas
// =============================
export async function fetchLinhas(ute) {
  if (!ute) throw new Error("UTE é obrigatória");

  const rows = await runQuery(pgQueries.selectLinhas, [ute], "fetchLinhas");

  return rows.map((r) =>
    mapToOption({
      id: r.linha,
      label: r.linha,
      count: r.count,
      countType: r.countType,
    }),
  );
}

// =============================
// Operações
// =============================
export async function fetchOperacoes(linha) {
  if (!linha) throw new Error("Linha é obrigatória");

  const rows = await runQuery(
    pgQueries.selectOperacoes,
    [linha],
    "fetchOperacoes",
  );

  return rows.map((r) =>
    mapToOption({
      id: r.operacao,
      label: `OP ${r.operacao}`,
      count: r.count,
      countType: r.countType,
    }),
  );
}

// =============================
// Tipos de Máquina
// =============================
export async function fetchTipos(linha, operacao) {
  if (!linha || !operacao) {
    throw new Error("Linha e operação são obrigatórias");
  }

  const rows = await runQuery(
    pgQueries.selectTipos,
    [linha, operacao],
    "fetchTipos",
  );

  return rows.map((r) =>
    mapToOption({
      id: r.codTipoMaquina ?? r.tipoMaquina,
      label: r.tipoMaquina,
      count: r.count,
      countType: r.countType,
      subCount: r.subCount,
      subCountType: r.subCountType,
      codTipoMaquina: r.codTipoMaquina,
    }),
  );
}

// =============================
// Máquinas
// =============================
export async function fetchMaquinas(linha, operacao, tipoMaquina) {
  if (!linha || !operacao || !tipoMaquina) {
    throw new Error("Linha, operação e tipoMaquina são obrigatórios");
  }

  const rows = await runQuery(
    pgQueries.selectMaquinas,
    [linha, operacao, tipoMaquina],
    "fetchMaquinas",
  );

  return rows.map((r) =>
    mapToOption({
      id: r.maquina,
      label: r.maquina,
      count: r.count,
      countType: r.countType,
      codTipoMaquina: r.codTipoMaquina,
    }),
  );
}
// =============================
// Componentes
// =============================
export async function fetchComponentes(maquina) {
  if (!maquina) throw new Error("Máquina é obrigatória");

  const rows = await runQuery(
    pgQueries.selectComponentes,
    [maquina],
    "fetchComponentes",
  );

  if (!rows.length) return [];

  const codigosSAP = extractCodigosSAP(rows);

  let materiaisMap = {};

  if (codigosSAP.length) {
    const response = await manusisMachineledger.getMaterialByCode(codigosSAP);
    const materiais = response?.data || [];
    materiaisMap = mapMateriaisByCodigo(materiais);
  }

  return rows.map((comp) => {
    const enriched = addComponenteEstoque(comp, materiaisMap);

    return {
      id: enriched.codSAP || enriched.codDotacao, // fallback seguro
      label: enriched.descComponente,
      descComponente: enriched.descComponente,
      caracTecnicas: enriched.caracTecnicas,
      fabricante: enriched.fabricante,
      codComercial: enriched.codComercial,
      codSAP: enriched.codSAP,
      codDotacao: enriched.codDotacao,
      tecnologia: enriched.tecnologia,
      dataCriacao: enriched.dataCriacao,

      meta: {
        ute: enriched.ute,
        linha: enriched.linha,
        operacao: enriched.operacao,
        codTipoMaquina: enriched.codTipoMaquina,
        tipoMaquina: enriched.tipoMaquina,
        maquina: enriched.maquina,
        mMaquina: enriched.mMaquina,
      },

      estoque: enriched.dadosEstoque ?? null,
    };
  });
}

// =============================
// Search
// =============================
export async function searchMachineLedger(text) {
  if (!text || text.trim().length < 2) {
    throw new Error("Busca deve ter pelo menos 2 caracteres");
  }

  return runQuery(pgQueries.searchMachineLedger, [text], "searchMachineLedger");
}

// =============================
// Tree View
// =============================
export async function fetchTreeView() {
  // console.log("oi");
  const rows = await runQuery(pgQueries.selectTreeBase, [], "Tree View");

  if (!rows.length) return [];

  return buildMachineTree(rows);
}
