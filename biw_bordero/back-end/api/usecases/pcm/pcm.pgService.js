//pcm.pgService.js
import { pool } from "../../postgreConnect.js";
import { pgQueries, TABLES } from "./pcm.pgQueries.js";
import { buildBulkInsert, chunkArray } from "./utils/bulkBuilder.js";

const BATCH_SIZE = 2000;

// =============================
// VERIFICAR SE EXISTEM DADOS
// =============================
export async function checkIfExists(ano, semana) {
  const { rows } = await pool.query(pgQueries.existUpload, [ano, semana]);

  return rows[0] || null;
}

// =============================
// SALVAR PROGRAMAÇÃO COMPLETA
// =============================
export async function saveProgramacao({
  ano,
  semana,
  disponibilidade,
  atividades,
  overwrite,
  user,
  fileName,
}) {
  const client = await pool.connect();
  // console.log("user na save: ", user);

  try {
    await client.query("BEGIN");

    const lockKey = ano * 100 + semana;

    await client.query("SELECT pg_advisory_xact_lock($1)", [lockKey]);

    //  Segurança extra
    if (!user || !user.matricula) {
      throw new Error("Usuário inválido para auditoria");
    }

    // =============================
    // Se overwrite, deletar primeiro
    // =============================
    if (overwrite) {
      await client.query(pgQueries.deleteDisponibilidadeByAnoSemana, [
        ano,
        semana,
      ]);

      await client.query(pgQueries.deleteAtividadesByAnoSemana, [ano, semana]);
    }

    // =============================
    // DISPONIBILIDADE EM LOTES
    // =============================
    const disponibilidadeBatches = chunkArray(disponibilidade, BATCH_SIZE);

    for (const batch of disponibilidadeBatches) {
      const bulk = buildBulkInsert({
        table: TABLES.DISPONIBILIDADE,
        columns: [
          "ano",
          "semana",
          "data",
          "turno",
          "horas",
          "inicio_disp",
          "fim_disp",
          "reg",
          "nome",
          "espec",
          "empresa",
          "tipo_contrato",
        ],
        rows: batch,
      });

      if (bulk) {
        await client.query(bulk.query, bulk.values);
      }
    }

    // =============================
    // ATIVIDADES EM LOTES
    // =============================
    const atividadesBatches = chunkArray(atividades, BATCH_SIZE);

    for (const batch of atividadesBatches) {
      const bulk = buildBulkInsert({
        table: TABLES.ATIVIDADES,
        columns: [
          "ano",
          "semana",
          "macro_ativ",
          "status_pcm",
          "criticidade",
          "prioridade",
          "tipo_atividade",
          "direc",
          "ordem",
          "data",
          "turno",
          "grupo",
          "linha",
          "op",
          "maquina",
          "atividade",
          "nome_mdo",
          "observacao",
          "pre_disposicoes",
          "inicio_ativ",
          "fim_ativ",
        ],
        rows: batch,
      });

      if (bulk) {
        await client.query(bulk.query, bulk.values);
      }
    }

    // =============================
    // REGISTRAR LOG DE UPLOAD
    // =============================
    await client.query(pgQueries.insertUploadLog, [
      ano,
      semana,
      user.matricula,
      overwrite,
      fileName,
    ]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// =============================
// GET PROGRAMAÇÃO FIM DE SEMANA
// =============================
// Agrupado por colaborador
export async function getProgramacaoPorColaborador(ano, semana) {
  const { rows } = await pool.query(pgQueries.getProgramacaoPorColaborador, [
    ano,
    semana,
  ]);
  return rows;
}
// Agrupado por linha
export async function getProgramacaoPorLinha(ano, semana) {
  const { rows } = await pool.query(pgQueries.getProgramacaoPorLinha, [
    ano,
    semana,
  ]);
  return rows;
}

// Para pegar startDate e endDate da semana (para renderização do Gantt)
export async function getSemanaRange(ano, semana) {
  const { rows } = await pool.query(pgQueries.semanaRange, [ano, semana]);
  const result = rows[0];

  // Se não houver resultado, retorna null
  if (!result) {
    return null;
  }

  return {
    ano: result.ano,
    semana: result.semana,
    startDate:
      result.startdate || result.startDate
        ? new Date(result.startdate || result.startDate)
        : null,
    endDate:
      result.enddate || result.endDate
        ? new Date(result.enddate || result.endDate)
        : null,
  };
}
