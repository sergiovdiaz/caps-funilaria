//machineledger.service.js
import { pool } from "../../postgreConnect.js";
import { pgQueries } from "./machineledger.pgQueries.js";
import { manusisMachineledger } from "../../conectores/manusis/manusis.router.js";
// import * as pgService from "./machineledger.pgService.js";
import { extractCodigosSAP } from "./utils/array.js";
import {
  mapMateriaisByCodigo,
  addComponenteEstoque,
  mapComponenteBase,
  mapRow,
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
  return runQuery(pgQueries.selectUtes, [], "fetchUtes");
}

// =============================
// Linhas
// =============================
export async function fetchLinhas(ute) {
  if (!ute) throw new Error("UTE é obrigatória");

  return runQuery(pgQueries.selectLinhas, [ute], "fetchLinhas");
}

// =============================
// Operações
// =============================
export async function fetchOperacoes(linha) {
  if (!linha) throw new Error("Linha é obrigatória");

  return runQuery(pgQueries.selectOperacoes, [linha], "fetchOperacoes");
}

// =============================
// Tipos de Máquina
// =============================
export async function fetchTipos(linha, operacao) {
  if (!linha || !operacao) {
    throw new Error("Linha e operação são obrigatórias");
  }

  return runQuery(pgQueries.selectTipos, [linha, operacao], "fetchTipos");
}

// =============================
// Máquinas
// =============================
export async function fetchMaquinas(linha, operacao, tipoMaquina) {
  if (!linha || !operacao || !tipoMaquina) {
    throw new Error("Linha, operação e tipoMaquina são obrigatórios");
  }

  return runQuery(
    pgQueries.selectMaquinas,
    [linha, operacao, tipoMaquina],
    "fetchMaquinas",
  );
}

// =============================
// Componentes
// =============================
export async function fetchComponentes(maquina) {
  if (!maquina) throw new Error("Máquina é obrigatória");

  // 1. DB (raw)
  const rows = await runQuery(
    pgQueries.selectComponentes,
    [maquina],
    "fetchComponentes",
  );
  // console.log(rows);

  if (!rows.length) return [];

  // // 2. map base (DB → API)
  const componentes = rows;

  // 3. extrair códigos SAP
  const codigosSAP = extractCodigosSAP(componentes);

  if (!codigosSAP.length) return rows;

  // 4. buscar dados externos (Manusis)
  const response = await manusisMachineledger.getMaterialByCode(codigosSAP);
  const materiais = response?.data || [];

  // 5. indexar materiais
  const materiaisMap = mapMateriaisByCodigo(materiais);

  // 6. enrich (estoque)
  return componentes.map((comp) => addComponenteEstoque(comp, materiaisMap));
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
