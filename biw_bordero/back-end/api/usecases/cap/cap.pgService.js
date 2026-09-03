// cap.pgService.js
import { pool } from "../../postgreConnect.js";
import {
  pgQueries,
  buildListarJustificativasQuery,
  buildListarMaquinasQuery,
  buildListarPendenciasQuery,
} from "./cap.pgQueries.js";
import {
  STATUS,
  validateTransition,
  getNextState,
} from "./utils/cap.jusStatus.js";
import { buildJustificativa } from "./cap.builders.js";
import { classifyLossRows } from "./utils/cap.lossVoices.js";
import { limitHourlyLosses } from "./utils/cap.lossLimit.js";

export async function getProducaoRaw(line, date) {
  const [producaoResult, jphResult] = await Promise.all([
    pool.query(pgQueries.getProducaoRaw, [date, line]),
    pool.query(pgQueries.getSccMaxJph),
  ]);

  const rows = classifyLossRows(producaoResult.rows);
  const sccJph = Number(jphResult.rows[0]?.jph_max);

  // Sem JPH de referência não alteramos o valor original.
  if (!Number.isFinite(sccJph)) {
    return rows.map((row) => ({
      ...row,
      jph_max: null,
      perda_limitada: false,
    }));
  }

  return limitHourlyLosses(rows, sccJph);
}

export async function getlistarJustificativas(filtros) {
  const { query, values } = buildListarJustificativasQuery(filtros);
  // console.log(
  //   "Executando query de listagem de justificativas com parâmetros:",
  //   filtros,
  // );

  const { rows } = await pool.query(query, values);
  // console.log("Query executada:", rows);

  return rows;
}

// export async function getJustificativaById(id) {
//   const { rows } = await pool.query(pgQueries.getCadeiaRelacionamentos, [id]);

//   console.log("Justificativa encontrada:", rows[0]);
//   return rows;
// }

export async function getJustificativaById(idJustificativa) {
  // ✅ Base correta
  const baseResult = await pool.query(pgQueries.getJustificativaBase, [
    idJustificativa,
  ]);

  // ✅ Relações (recursivo)
  const relacoesResult = await pool.query(pgQueries.getCadeiaRelacionamentos, [
    idJustificativa,
  ]);

  // console.log("Resultado da base:", baseResult.rows[0]);
  // console.log(relacoesResult.rows);

  return buildJustificativa(
    baseResult.rows,
    relacoesResult.rows,
    idJustificativa,
  );
}

export async function getJustificativaStatus(id) {
  const { rows } = await pool.query(pgQueries.getJustificativaStatus, [id]);

  return rows[0];
}

export async function getCapAlarms(line, [start, end]) {
  const query = `
    SELECT *
    FROM cap.cap_get_line_status_history(
      $1::timestamp,
      $2::timestamp,
      $3::text
    );
  `;
  // console.log("Executando query de alarms com parâmetros:", {
  //   line,
  //   start,
  //   end,
  // });

  const { rows } = await pool.query(query, [start, end, line]);
  // console.log(rows);

  return rows.map((row) => ({
    ...row,
    losstime_min: parseFloat(row.losstime_min) || 0,
  }));
}

export async function getMaquinas(filtros = {}) {
  const { query, values } = buildListarMaquinasQuery(filtros);

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function getMantenedores() {
  const query = `
    SELECT 
      CONCAT(
          split_part(u.nome, ' ', 1), -- primeiro nome
          ' ',
          split_part(u.nome, ' ', array_length(string_to_array(u.nome, ' '), 1)), -- último nome
          ' - ',
          m.tecnologia
      ) AS mantenedor,
      m.id

    FROM cap.dim_mantenedor m

    LEFT JOIN auth.usuarios u
      ON m.matricula = u.matricula
    WHERE m.ativo = true
    ORDER BY m.id
    `;

  const { rows } = await pool.query(query);
  // console.log(rows);

  return rows;
}

export async function criarJustificativa(payload) {
  const client = await pool.connect();
  // console.log("Payload recebido em criarJustificativa:", payload);

  try {
    await client.query("BEGIN");

    const {
      data,
      horaselecionada,
      linha,
      matricula,
      causa_raiz,
      descricao,
      dur_min,
      maquina,
      comentario,
      componente,
      alarms = [],
      relacionado = [],
      resolvido_por_mim = false,
      mantenedor_id = null,
      mantenedor_nome_livre = null,
    } = payload;

    // 🔹 1. Buscar validador automaticamente
    const resp = await client.query(pgQueries.getResponsavelByCausaRaiz, [
      causa_raiz,
    ]);

    const validador = resp.rows.length > 0 ? resp.rows[0].responsavel : null;

    // 🔹 2. Definir mantenedor_id, usuario_id e mantenedor_nome_livre
    let mantenedorId = null;
    let usuarioId = null;
    let mantenedorNomeLivre = null;

    if (resolvido_por_mim) {
      // Resolvido por mim mesmo - apenas matricula já é suficiente
      // usuarioId = matricula; // ou o campo correto de usuário
      mantenedorId = null;
      mantenedorNomeLivre = null;
    } else {
      // Não foi resolvido por mim
      if (mantenedor_id) {
        // Tem ID do mantenedor selecionado
        mantenedorId = mantenedor_id;
        usuarioId = null;
        mantenedorNomeLivre = null;
      } else if (mantenedor_nome_livre && mantenedor_nome_livre.trim()) {
        // Nome digitado manualmente
        mantenedorNomeLivre = mantenedor_nome_livre.trim();
        mantenedorId = null;
        usuarioId = null;
      }
    }

    // 🔹 3. Criar yficativa
    const { rows } = await client.query(pgQueries.insertJustificativa, [
      data,
      horaselecionada,
      linha,
      matricula,
      STATUS.PENDENTE_VALIDACAO,
      causa_raiz,
      validador,
      dur_min,
      descricao,
      data,
      componente,
      maquina,
      mantenedorId, // mantenedor_id
      usuarioId, // usuario_id
      mantenedorNomeLivre, // mantenedor_nome_livre
    ]);

    const idJustificativa = rows[0].id;

    // 🔹 4. Histórico
    await client.query(pgQueries.insertHistorico, [
      idJustificativa,
      data,
      horaselecionada,
      linha,
      matricula,
      causa_raiz,
      comentario,
      descricao,
      dur_min,
      maquina,
      alarms, // alarmsid como array
      componente,
      mantenedorId, // mantenedor_id
      usuarioId, // usuario_id
      mantenedorNomeLivre, // mantenedor_nome_livre
    ]);

    // 🔹 5. Inserir alarmes (batch)
    if (alarms.length > 0) {
      const values = [];
      const placeholders = alarms.map((alarmId, i) => {
        const idx = i * 4;
        values.push(idJustificativa, alarmId, data, horaselecionada);
        return `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4})`;
      });

      await client.query(
        `
        INSERT INTO cap.dim_alarmesjustificados
        (id_justificativa, alarmsid, data, horaselecionada)
        VALUES ${placeholders.join(", ")}
      `,
        values,
      );
    }

    // 🔹 6. Alocação de tempo (se houver relacionados)
    if (relacionado.length > 0) {
      let tempoRestante = Number(dur_min);

      const { rows: relacionadosDB } = await client.query(
        `
        SELECT 
          j.id,
          j.dur_min,
          COALESCE(SUM(r.tempo_alocado), 0) AS ja_alocado
        FROM cap.dim_justificativa j
        LEFT JOIN cap.rel_justificativa_alocacao_tempo r
          ON r.justificativa_relacionada_id = j.id
        WHERE j.id = ANY($1)
        GROUP BY j.id, j.dur_min
        ORDER BY j.dur_min - COALESCE(SUM(r.tempo_alocado), 0) DESC
        `,
        [relacionado],
      );

      const alocacoes = [];

      for (const rel of relacionadosDB) {
        if (tempoRestante <= 0) break;

        const durTotal = Number(rel.dur_min || 0);
        const jaAlocado = Number(rel.ja_alocado || 0);
        const disponivel = durTotal - jaAlocado;

        if (disponivel <= 0) continue;

        const tempoAlocado = Math.min(tempoRestante, disponivel);

        alocacoes.push({
          justificativa_id: idJustificativa,
          justificativa_relacionada_id: rel.id,
          tempo_alocado: tempoAlocado,
        });

        tempoRestante -= tempoAlocado;
      }

      if (alocacoes.length > 0) {
        const values = [];
        const placeholders = alocacoes.map((item, i) => {
          const idx = i * 4;
          values.push(
            item.justificativa_id,
            item.justificativa_relacionada_id,
            item.tempo_alocado,
            new Date(),
          );
          return `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4})`;
        });

        await client.query(
          `
          INSERT INTO cap.rel_justificativa_alocacao_tempo
          (justificativa_id, justificativa_relacionada_id, tempo_alocado, created_at)
          VALUES ${placeholders.join(", ")}
          `,
          values,
        );
      }
    }

    await client.query("COMMIT");

    return {
      id: idJustificativa,
      message: "Justificativa criada com sucesso",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar justificativa:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function approve({ justificativaId, userId, newStatus }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ─────────────────────────────────────────────
    // BUSCA ESTADO ATUAL
    // ─────────────────────────────────────────────

    const justificativa = await getJustificativaStatus(justificativaId);

    let to = newStatus;

    // ─────────────────────────────────────────────
    // REGRA
    // ─────────────────────────────────────────────
    if (justificativa.idstatus === STATUS.EM_REVISAO) {
      if (justificativa.responsavel === "PRODUÇÃO") {
        // produção pode finalizar direto
        to = STATUS.FINALIZADA;
      } else {
        // não é produção → volta pra validação
        to = STATUS.PENDENTE_VALIDACAO;
        validador = justificativa.responsavel;
      }
    }

    // valida transição
    validateTransition(justificativa.idstatus, to);

    const statusLabel =
      to === STATUS.PENDENTE_VALIDACAO
        ? "Revisão Aprovada"
        : "Justificativa Finalizada";

    // ─────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────
    const fields = [`idstatus = $2`];
    const values = [justificativaId, to];

    let index = 3;

    if (validador) {
      fields.push(`validador = $${index++}`);
      values.push(validador);
    }

    const updateQuery = `
          UPDATE cap.dim_justificativa
          SET ${fields.join(", ")}
          WHERE id = $1
        `;

    await client.query(updateQuery, values);

    // ─────────────────────────────────────────────
    // HISTÓRICO
    // ─────────────────────────────────────────────
    await client.query(
      `
      INSERT INTO cap.historico_justificativa (
        id_justificativa,
        data,
        horaselecionada,
        linha,
        matricula,
        causa_raiz,
        comentario,
        descricao,
        duracao_total,
        maquina,
        alarmsid,
        componente,
        created_at
      )
      SELECT 
        id_justificativa,
        data,
        horaselecionada,
        linha,
        $2,
        causa_raiz,
        $3,
        descricao,
        duracao_total,
        maquina,
        alarmsid,
        componente,
        NOW()
      FROM cap.historico_justificativa
      WHERE id_justificativa = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [justificativaId, userId, statusLabel],
    );

    await client.query("COMMIT");

    return { ok: true };
  } catch (err) {
    await client.query("ROLLBACK");
    return { ok: false, message: err.message };
  } finally {
    client.release();
  }
}

function mapToDbFields(obj) {
  const fieldMap = {
    modo_falha: "descricao",
  };

  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    result[fieldMap[key] || key] = value;
  }

  return result;
}

export async function requestChanges({ justificativa, userId, changes }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let to;

    const mudouCausaRaiz = Object.prototype.hasOwnProperty.call(
      changes,
      "causa_raiz",
    );

    // ─────────────────────────────────────────────
    // NOVO RESPONSÁVEL (via causa)
    // ─────────────────────────────────────────────
    let novoResponsavel = null;

    if (mudouCausaRaiz && changes.causa_raiz) {
      const respQuery = `
        SELECT responsavel
        FROM cap.dim_responsavel_causaraiz
        WHERE causa_raiz = $1
        LIMIT 1
      `;

      const { rows } = await client.query(respQuery, [changes.causa_raiz]);

      if (rows.length > 0) {
        novoResponsavel = rows[0].responsavel;
      }
    }

    // ─────────────────────────────────────────────
    // QUANTIDADE DE TROCAS DE RESPONSÁVEL
    // ─────────────────────────────────────────────
    const trocaQuery = `
      SELECT COUNT(*) AS qtd_trocas
      FROM (
        SELECT 
          d.responsavel,
          LAG(d.responsavel) OVER (ORDER BY h.created_at) AS prev_responsavel
        FROM cap.historico_justificativa h
        LEFT JOIN cap.dim_responsavel_causaraiz d
          ON h.causa_raiz = d.causa_raiz
        WHERE h.id_justificativa = $1
      ) t
      WHERE responsavel IS DISTINCT FROM prev_responsavel
    `;

    const { rows: trocaRows } = await client.query(trocaQuery, [
      justificativa.id,
    ]);

    const qtdTrocasResponsavel = Number(trocaRows[0].qtd_trocas);
    // console.log("Quantidade de trocas de responsável:", qtdTrocasResponsavel);

    // ─────────────────────────────────────────────
    // STATE MACHINE 🔥
    // ─────────────────────────────────────────────
    const { nextStatus, validador } = getNextState({
      statusAtual: justificativa.idstatus,
      mudouCausaRaiz,
      responsavelAtual: justificativa.responsavel,
      novoResponsavel,
      qtdTrocasResponsavel,
    });

    to = nextStatus;

    validateTransition(justificativa.idstatus, to);

    // console.log("Transição:", justificativa.idstatus, "→", to);

    // ─────────────────────────────────────────────
    // CAMPOS
    // ─────────────────────────────────────────────
    const { comentario, ...campos } = changes;

    const camposMapped = mapToDbFields(campos);

    // aplica validador vindo da regra
    if (validador) {
      camposMapped.validador = validador;
    }

    // fallback padrão (caso não venha da regra)
    if (!camposMapped.validador) {
      if (to === STATUS.EM_REVISAO) {
        camposMapped.validador = "PRODUÇÃO";
      }
      if (to === STATUS.PENDENTE_VALIDACAO) {
        camposMapped.validador = justificativa.responsavel;
      }
    }

    // ─────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────
    const fields = [];
    const values = [];
    let index = 1;

    fields.push(`idstatus = $${index++}`);
    values.push(to);

    for (const [key, value] of Object.entries(camposMapped)) {
      fields.push(`${key} = $${index++}`);
      values.push(value);
    }

    values.push(justificativa.id);

    const updateQuery = `
      UPDATE cap.dim_justificativa
      SET ${fields.join(", ")}
      WHERE id = $${index}
    `;

    await client.query(updateQuery, values);

    // ─────────────────────────────────────────────
    // HISTÓRICO
    // ─────────────────────────────────────────────
    const lastHistQuery = `
      SELECT *
      FROM cap.historico_justificativa
      WHERE id_justificativa = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const { rows } = await client.query(lastHistQuery, [justificativa.id]);

    const lastHist = rows[0];

    if (!lastHist) {
      throw new Error("Histórico não encontrado");
    }

    const camposHistorico = { ...camposMapped };
    delete camposHistorico.validador;

    const newHist = {
      ...lastHist,
      ...camposHistorico,
      comentario: comentario ?? lastHist.comentario,
      matricula: userId,
      created_at: new Date(),
    };

    delete newHist.id;

    const keys = Object.keys(newHist);
    const histValues = Object.values(newHist);

    const columns = keys.join(", ");
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

    const insertHistQuery = `
      INSERT INTO cap.historico_justificativa (${columns})
      VALUES (${placeholders})
    `;

    await client.query(insertHistQuery, histValues);

    await client.query("COMMIT");

    return {
      ok: true,
      message: "Alteração realizada com sucesso",
    };
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Erro no requestChanges:", err);

    return {
      ok: false,
      message: err.message || "Erro interno",
    };
  } finally {
    client.release();
  }
}

// export async function requestChanges({ justificativa, userId, changes }) {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     // console.log("Payload recebido:", changes);

//     let to;

//     const mudouCausaRaiz = Object.prototype.hasOwnProperty.call(
//       changes,
//       "causa_raiz",
//     );

//     // novo responsável
//     let novoResponsavel = null;

//     if (mudouCausaRaiz && changes.causa_raiz) {
//       const respQuery = `
//     SELECT responsavel
//     FROM cap.dim_responsavel_causaraiz
//     WHERE causa_raiz = $1
//     LIMIT 1
//   `;

//       const { rows } = await client.query(respQuery, [changes.causa_raiz]);

//       if (rows.length > 0) {
//         novoResponsavel = rows[0].responsavel;
//       }
//     }

//     // ─────────────────────────────────────────────
//     // REGRAS DE TRANSIÇÃO
//     // ─────────────────────────────────────────────
//     console.log(justificativa);
//     if (justificativa.idstatus === STATUS.PENDENTE_VALIDACAO) {
//       if (mudouCausaRaiz) {
//         if (novoResponsavel && novoResponsavel === justificativa.responsavel) {
//           to = STATUS.FINALIZADA;
//         } else {
//           to = STATUS.EM_REVISAO;
//         }
//       } else {
//         to = STATUS.FINALIZADA;
//       }
//     } else if (justificativa.idstatus === STATUS.EM_REVISAO) {
//       if (!mudouCausaRaiz) {
//         se nao mudou a causa raiz e o responsavel é PRODUÇÃO então finaliza
//         se nãu mudou a causa raiz e não é a responsavel, passa pendente validação e o validor é o responsavel antigo
//         throw new Error("Nenhuma mudança relevante para envio");
//       }
//       to = STATUS.PENDENTE_VALIDACAO; e o validador é o requestChanges
//     } else {
//       throw new Error("Não é possível alterar essa justificativa");
//     }

//     validateTransition(justificativa.idstatus, to);

//     console.log("Transição válida:", justificativa.idstatus, "→", to);

//     // ─────────────────────────────────────────────
//     // SEPARA CAMPOS
//     // ─────────────────────────────────────────────
//     const { comentario, ...campos } = changes;

//     const camposMapped = mapToDbFields(campos);

//     // REGRA DE NEGÓCIO AQUI
//     if (to === STATUS.EM_REVISAO) {
//       camposMapped.validador = "PRODUÇÃO";
//     }
//     if (to === STATUS.PENDENTE_VALIDACAO) {
//       camposMapped.validador = justificativa.responsavel;
//     }

//     // ─────────────────────────────────────────────
//     // UPDATE DINÂMICO
//     // ─────────────────────────────────────────────
//     const fields = [];
//     const values = [];
//     let index = 1;

//     fields.push(`idstatus = $${index++}`);
//     values.push(to);

//     for (const [key, value] of Object.entries(camposMapped)) {
//       fields.push(`${key} = $${index++}`);
//       values.push(value);
//     }

//     values.push(justificativa.id);

//     const updateQuery = `
//       UPDATE cap.dim_justificativa
//       SET ${fields.join(", ")}
//       WHERE id = $${index}
//     `;

//     await client.query(updateQuery, values);

//     // ─────────────────────────────────────────────
//     // HISTÓRICO (SNAPSHOT)
//     // ─────────────────────────────────────────────
//     const lastHistQuery = `
//       SELECT *
//       FROM cap.historico_justificativa
//       WHERE id_justificativa = $1
//       ORDER BY created_at DESC
//       LIMIT 1
//     `;

//     const { rows } = await client.query(lastHistQuery, [justificativa.id]);

//     const lastHist = rows[0];

//     if (!lastHist) {
//       throw new Error("Histórico não encontrado");
//     }

//     const camposHistorico = { ...camposMapped };
//     delete camposHistorico.validador;

//     const newHist = {
//       ...lastHist,
//       ...camposHistorico,
//       comentario: comentario ?? lastHist.comentario,
//       matricula: userId,
//       created_at: new Date(),
//     };

//     delete newHist.id;

//     const keys = Object.keys(newHist);
//     const histValues = Object.values(newHist);

//     const columns = keys.join(", ");
//     const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

//     const insertHistQuery = `
//       INSERT INTO cap.historico_justificativa (${columns})
//       VALUES (${placeholders})
//     `;

//     await client.query(insertHistQuery, histValues);

//     await client.query("COMMIT");

//     return {
//       ok: true,
//       message: "Alteração realizada com sucesso",
//     };
//   } catch (err) {
//     await client.query("ROLLBACK");

//     console.error("Erro no requestChanges:", err);

//     return {
//       ok: false,
//       message: err.message || "Erro interno",
//     };
//   } finally {
//     client.release();
//   }
// }

export async function listarJustificativasPendencias(filtros = {}) {
  try {
    const { query, values } = buildListarPendenciasQuery(filtros);

    const { rows } = await pool.query(query, values);
    return rows;
  } catch (err) {
    console.error("Erro ao listar justificativas pendentes:", err);
    throw err;
  }
}

export async function listarValidacaoPendencias(filtros = {}) {
  const { query, values } = buildListarJustificativasQuery(filtros);

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function listarHistoricoJustificativas(startDate, endDate) {
  try {
    const { rows } = await pool.query(pgQueries.getCapHistoricoJustificativas, [
      startDate,
      endDate,
    ]);

    return rows;
  } catch (err) {
    console.error("Erro na query de histórico CAP:", err);
    return [];
  }
}

export async function getResponsaveis() {
  try {
    const query = `
      SELECT *
      FROM cap.dim_responsavel;
    `;

    const { rows } = await pool.query(query);

    return rows;
  } catch (err) {
    console.error("Erro ao consultar responsáveis:", err);
    throw err;
  }
}

const causaMap = {
  "FALTA ALIMENTAÇÃO": "FALTA_ALIMENTACAO",
  "FALTA ABSORÇÃO": "FALTA_ABSORCAO",
};

export async function getDisponivelAlocacao({
  linha,
  causaRaiz,
  ts_inicio,
  horas,
}) {
  const client = await pool.connect();

  const causaNormalizada = causaMap[causaRaiz] || causaRaiz;

  try {
    const { rows } = await client.query(pgQueries.getDisponivelAlocacao, [
      linha,
      causaNormalizada,
      ts_inicio,
      horas,
    ]);

    return { ok: true, data: rows };
  } catch (err) {
    console.error("Erro getDisponivelAlocacao:", err);
    return { ok: false, message: err.message };
  } finally {
    client.release();
  }
}
