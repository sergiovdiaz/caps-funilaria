import pg from "pg";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

// Configuração
const envPath = path.resolve(process.cwd(), "..", ".env");
dotenv.config({ path: envPath });

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

/**
 * Converte timestamp em ms para formato ISO com timezone
 * @param {number} timestamp - Timestamp em milissegundos
 * @returns {string} Data no formato ISO 8601
 */

function toISOTimestamp(timestamp) {
  if (!timestamp) return null;

  // Se já estiver no formato ISO com 'T' e 'Z', retorna diretamente
  if (timestamp.includes("T") && timestamp.endsWith("Z")) {
    // Adiciona 3 horas ao timestamp ISO
    const date = new Date(timestamp);
    date.setHours(date.getHours());
    return date.toISOString();
  }

  // Se estiver no formato 'YYYY-MM-DDTHH:MM' (sem segundos)
  if (
    timestamp.includes("T") &&
    timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  ) {
    // Adiciona segundos e depois adiciona 3 horas
    const date = new Date(timestamp + ":00");
    date.setHours(date.getHours());
    return date.toISOString();
  }

  // Se estiver em outro formato, converte para Date, adiciona 3 horas e depois para ISO
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Formato de timestamp inválido: ${timestamp}`);
  }

  date.setHours(date.getHours());
  return date.toISOString();
}
/**
 * Executa consulta convertendo a coluna _timestamp de ms para datetime
 * @param {string} table - Nome da tabela
 * @param {object} filters - Filtros de consulta
 * @param {number} filters.startTime - Timestamp inicio (ms)
 * @param {number} filters.endTime - Timestamp fim (ms)
 * @param {string} [filters.line] - Filtro por linha
 * @param {string} [filters.station] - Filtro por estação
 * @param {string} [filters.machine] - Filtro por máquina
 * @returns {Promise<Array>} Resultados formatados
 */
export async function querySelectPostgre(table, filters) {
  // Converte os timestamps
  const startISO = toISOTimestamp(filters.startTime);
  const endISO = toISOTimestamp(filters.endTime);

  const queryParams = [startISO, endISO];
  let whereClauses = [`to_timestamp(_timestamp/1000.0) BETWEEN $1 AND $2`];

  // Adiciona filtros com mapeamento correto
  let paramIndex = 3;
  for (const [filter, value] of Object.entries(filters)) {
    if (["startTime", "endTime"].includes(filter)) continue;

    const dbColumn = filter;

    if (value) {
      whereClauses.push(`"${dbColumn}" = $${paramIndex}`);
      queryParams.push(value);
      paramIndex++;
    }
  }

  const queryText = `
    SELECT 
      *,
      to_timestamp(_timestamp / 1000.0)  AS Timestamp
    FROM "${table}"
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY Timestamp
  `;

  // Debug: log da query gerada
  console.debug("Executando query:", {
    query: queryText,
    params: queryParams,
  });

  try {
    const { rows } = await pool.query(queryText, queryParams);

    // Transforma as rows no formato desejado
    if (rows.length === 0) {
      return { timestamp: [] }; // Retorna objeto vazio se não houver resultados
    }

    // Inicializa o objeto de resultado com arrays vazios para cada coluna
    const result = {};
    const columns = Object.keys(rows[0]);

    columns.forEach((col) => {
      result[col] = [];
    });

    // Preenche os arrays com os valores de cada coluna
    rows.forEach((row) => {
      columns.forEach((col) => {
        // Verifica se o valor é booleano e converte para 1 ou 0
        const value =
          typeof row[col] === "boolean" ? (row[col] ? 1 : 0) : row[col];
        result[col].push(value);
      });
    });

    return result;
  } catch (err) {
    console.error("Erro na consulta:", {
      query: queryText,
      params: queryParams,
      error: err.message,
      stack: err.stack,
    });
  }
}

// export async function atualizarUltimoStatusEnergySaving() {
//   const queryText = `
//    WITH dados_filtrados AS (
//     SELECT
//         _timestamp,
//         TO_TIMESTAMP(_timestamp / 1000) AS ts,
//         "Plant", "Shop", "Line", "Station", "Machine",
//         "Output", "Flow",
//         LAG("Output", 1) OVER (PARTITION BY "Plant", "Shop", "Line", "Station", "Machine" ORDER BY TO_TIMESTAMP(_timestamp / 1000)) AS prev_output,
//         ROW_NUMBER() OVER (PARTITION BY "Plant", "Shop", "Line", "Station", "Machine" ORDER BY TO_TIMESTAMP(_timestamp / 1000)) AS rn
//     FROM public.startstopca
//     WHERE TO_TIMESTAMP(_timestamp / 1000) >= NOW() - INTERVAL '7 days'
// ),
// inicios_output_true AS (
//     SELECT
//         _timestamp, ts, "Plant", "Shop", "Line", "Station", "Machine", "Output", "Flow", rn AS start_rn
//     FROM dados_filtrados
//     WHERE "Output" = true AND (prev_output IS FALSE OR prev_output IS NULL)
// ),
// periodos_validos AS (
//     SELECT
//         d1._timestamp AS start_timestamp,
//         d1.ts AS start_time,
//         d1."Plant", d1."Shop", d1."Line", d1."Station", d1."Machine",
//         d1.start_rn,
//         MAX(d2.rn) AS end_rn,
//         MAX(d2._timestamp) AS end_timestamp
//     FROM inicios_output_true d1
//     JOIN dados_filtrados d2
//       ON d2."Plant" = d1."Plant" AND d2."Shop" = d1."Shop" AND d2."Line" = d1."Line"
//          AND d2."Station" = d1."Station" AND d2."Machine" = d1."Machine"
//          AND d2.rn >= d1.start_rn
//          AND d2."Output" = true
//     GROUP BY d1._timestamp, d1.ts, d1."Plant", d1."Shop", d1."Line", d1."Station", d1."Machine", d1.start_rn
//     HAVING COUNT(*) >= 10  -- alterado de 7 para 10
// ),
// analisado AS (
//     SELECT
//         p.*,
//         TO_TIMESTAMP(p.end_timestamp / 1000) AS end_time,

//         (SELECT AVG("Flow")
//          FROM dados_filtrados d
//          WHERE d."Plant" = p."Plant" AND d."Shop" = p."Shop" AND d."Line" = p."Line"
//            AND d."Station" = p."Station" AND d."Machine" = p."Machine"
//            AND d.rn BETWEEN p.start_rn - 5 AND p.start_rn - 1
//         ) AS flow_antes,

//         ARRAY(
//          SELECT "Flow"
//          FROM dados_filtrados d
//          WHERE d."Plant" = p."Plant" AND d."Shop" = p."Shop" AND d."Line" = p."Line"
//            AND d."Station" = p."Station" AND d."Machine" = p."Machine"
//            AND d.rn BETWEEN p.start_rn AND p.start_rn + 8  -- 9 pontos
//          ORDER BY d.rn
//         ) AS flow_9_apos,

//         (SELECT AVG("Flow")
//          FROM dados_filtrados d
//          WHERE d."Plant" = p."Plant" AND d."Shop" = p."Shop" AND d."Line" = p."Line"
//            AND d."Station" = p."Station" AND d."Machine" = p."Machine"
//            AND d.rn BETWEEN p.end_rn - 4 AND p.end_rn
//            AND d."Output" = true
//         ) AS flow_final
//     FROM periodos_validos p
// ),
// resultado_final AS (
//     SELECT *,
//         CAST(EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS INTEGER) AS duration_minutos,
//         CASE
//             WHEN flow_antes IS NULL OR flow_antes < 0 THEN 'Sem medição de vazão'
//             WHEN array_length(flow_9_apos, 1) = 9 AND
//                  flow_9_apos[1] = flow_9_apos[2] AND
//                  flow_9_apos[1] = flow_9_apos[3] AND
//                  flow_9_apos[1] = flow_9_apos[4] AND
//                  flow_9_apos[1] = flow_9_apos[5] AND
//                  flow_9_apos[1] = flow_9_apos[6] AND
//                  flow_9_apos[1] = flow_9_apos[7] AND
//                  flow_9_apos[1] = flow_9_apos[8] AND
//                  flow_9_apos[1] = flow_9_apos[9]
//               THEN 'Energy Saving realizado com sucesso!'
//             WHEN flow_final < 0.5 * flow_antes THEN 'Energy Saving realizado com sucesso!'
//             ELSE 'Comando em bypass'
//         END AS status
//     FROM analisado
// ),
// ultimos_eventos AS (
//     SELECT DISTINCT ON ("Plant", "Shop", "Line", "Station", "Machine")
//         "Plant", "Shop", "Line", "Station", "Machine",
//         start_time,
//         end_time,
//         duration_minutos,
//         status
//     FROM resultado_final
//     ORDER BY "Plant", "Shop", "Line", "Station", "Machine", start_time DESC
// )
// SELECT *
// FROM ultimos_eventos
// ORDER BY start_time DESC;

//   `;

//   try {
//     const { rows } = await pool.query(queryText);

//     for (const linha of rows) {
//       const {
//         Line,
//         Station,
//         Machine,
//         start_time,
//         end_time,
//         duration_minutos,
//         status,
//       } = linha;

//       if (caMessages?.[Line]?.[Station]?.[Machine]) {
//         caMessages[Line][Station][Machine].Ultimo_status = {
//           Start: start_time,
//           End: end_time,
//           Dur: duration_minutos,
//           Status: status,
//         };
//       } else {
//         console.warn(
//           `🔍 Máquina não encontrada em caMessages: ${Line} > ${Station} > ${Machine}`,
//         );
//       }
//     }
//   } catch (err) {
//     console.error("❌ Erro na consulta energy saving:", err);
//   }
// }

// export async function insertToTable(tableName, data) {
//   try {
//     // 1. Verificar se a tabela existe
//     const tableCheckQuery = `
//       SELECT EXISTS (
//         SELECT FROM information_schema.tables
//         WHERE table_schema = 'public'
//         AND table_name = $1
//       )
//     `;
//     const { rows: tableCheckRows } = await pool.query(tableCheckQuery, [
//       tableName,
//     ]);
//     const tableExists = tableCheckRows[0].exists;

//     // 2. Criar tabela caso não exista
//     if (!tableExists) {
//       const columns = Object.entries(data)
//         .map(([key, value]) => {
//           if (key === "_timestamp") return `"${key}" BIGINT`;
//           return `"${key}" TEXT`;
//         })
//         .join(", ");

//       // Adiciona a coluna id automática no início
//       const createTableQuery = `CREATE TABLE "${tableName}" (id BIGSERIAL PRIMARY KEY, ${columns})`;
//       await pool.query(createTableQuery);
//       console.log(`Tabela "${tableName}" criada!`);
//     }

//     // 3. Inserir dados
//     const keys = Object.keys(data);
//     const values = Object.values(data);
//     const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

//     const insertQuery = `INSERT INTO "${tableName}" (${keys
//       .map((k) => `"${k}"`)
//       .join(", ")}) VALUES (${placeholders})`;
//     await pool.query(insertQuery, values);

//     // console.log(`Dados inseridos na tabela "${tableName}" com sucesso.`);
//   } catch (err) {
//     console.error("Erro ao inserir JSON na tabela:", err.message);
//   }
// }

// export async function querySavisionPuntone(table, limit = 10) {
//   const query = `
//   SELECT
//     id,
//     to_char(to_timestamp("_timestamp" / 1000.0), 'DD/MM/YYYY HH24:MI:SS') AS timestamp,
//     "cis" AS cis,
//     "img_labeled" AS image,
//     UPPER("label") AS status,
//     CASE
//       WHEN to_char(to_timestamp("_timestamp" / 1000.0), 'HH24:MI') BETWEEN '06:00' AND '15:48' THEN 1
//       WHEN to_char(to_timestamp("_timestamp" / 1000.0), 'HH24:MI') BETWEEN '01:09' AND '06:00' THEN 3
//       ELSE 2
//     END AS turno,
//     to_char(
//       CASE
//         WHEN extract(dow from to_timestamp("_timestamp" / 1000.0)) = 1 THEN
//           CASE
//             WHEN to_timestamp("_timestamp" / 1000.0)::time < time '01:09' THEN
//               (to_timestamp("_timestamp" / 1000.0) - interval '1 day')::date
//             WHEN to_timestamp("_timestamp" / 1000.0)::time < time '20:00' THEN
//               (to_timestamp("_timestamp" / 1000.0) - interval '1 day')::date
//             ELSE
//               to_timestamp("_timestamp" / 1000.0)::date
//           END
//         WHEN extract(dow from to_timestamp("_timestamp" / 1000.0)) = 0 THEN
//           CASE
//             WHEN to_timestamp("_timestamp" / 1000.0)::time >= time '20:00' THEN
//               to_timestamp("_timestamp" / 1000.0)::date
//             ELSE
//               (to_timestamp("_timestamp" / 1000.0) - interval '1 day')::date
//           END
//         ELSE
//           CASE
//             WHEN to_timestamp("_timestamp" / 1000.0)::time < time '01:09' THEN
//               (to_timestamp("_timestamp" / 1000.0) - interval '1 day')::date
//             ELSE
//               to_timestamp("_timestamp" / 1000.0)::date
//           END
//       END,
//       'DD/MM/YYYY'
//     ) AS dia_produtivo
//   FROM "${table}"
//   ORDER BY id DESC
//   LIMIT $1
// `;

//   try {
//     const { rows } = await pool.query(query, [limit]);
//     return rows;
//   } catch (err) {
//     console.error("Erro na consulta:", err);
//     return [];
//   }
// }

// export async function querySavisionResumo(table) {
//   // Aqui definimos as 4 queries
//   const queries = {
//     resumoTurnos: `
//       WITH params AS (
//         SELECT 'hoje' AS periodo
//         UNION ALL
//         SELECT 'semana_atual'
//         UNION ALL
//         SELECT 'semanas'
//       ),
//       intervalo AS (
//         SELECT
//           periodo,
//           CASE
//             WHEN periodo = 'hoje' THEN
//               ARRAY[
//                 date_trunc('day', now()) + interval '1 hour 9 minutes',
//                 date_trunc('day', now() + interval '1 day') + interval '1 hour 9 minutes'
//               ]
//             WHEN periodo = 'semana_atual' THEN
//               ARRAY[
//                 date_trunc('week', now()) + interval '1 hour 9 minutes',
//                 date_trunc('week', now() + interval '1 week') + interval '1 hour 9 minutes'
//               ]
//             WHEN periodo = 'semanas' THEN
//               ARRAY[
//                 date_trunc('week', now() - interval '5 weeks') + interval '1 hour 9 minutes',
//                 date_trunc('week', now() + interval '1 week') + interval '1 hour 9 minutes'
//               ]
//           END AS range_start_end
//         FROM params
//       ),
//       dia_produtivo AS (
//         SELECT s.*, i.periodo
//         FROM "${table}" s
//         JOIN intervalo i
//           ON to_timestamp(s._timestamp/1000) >= i.range_start_end[1]
//          AND to_timestamp(s._timestamp/1000) <  i.range_start_end[2]
//       ),
//       com_turno AS (
//         SELECT *,
//           CASE
//             WHEN to_char(to_timestamp(_timestamp/1000), 'HH24:MI') BETWEEN '06:00' AND '15:48' THEN 1
//             WHEN to_char(to_timestamp(_timestamp/1000), 'HH24:MI') BETWEEN '01:09' AND '05:59' THEN 3
//             ELSE 2
//           END AS turnoid
//         FROM dia_produtivo
//       )
//       SELECT
//         periodo,
//         turnoid,
//         COUNT(DISTINCT CASE WHEN label = 'ok' THEN cis END) AS ok,
//         COUNT(DISTINCT CASE WHEN label = 'ko' THEN cis END) AS ko
//       FROM com_turno
//       GROUP BY periodo, turnoid
//       ORDER BY periodo, turnoid;
//     `,
//     Horaria: `
//     -- Define o dia produtivo de hoje
//     WITH dia_produtivo AS (
//         SELECT *
//         FROM public.savision_puntone
//         WHERE to_timestamp(_timestamp/1000) >= date_trunc('day', now()) + interval '1 hour 9 minutes'
//           AND to_timestamp(_timestamp/1000) < date_trunc('day', now() + interval '1 day') + interval '1 hour 9 minutes'
//     ),

//     -- Define os intervalos específicos do dia
//     intervalos AS (
//         SELECT *
//         FROM (VALUES
//             ('01:09', '02:00'),
//             ('02:00', '03:00'),
//             ('03:00', '04:00'),
//             ('04:00', '05:00'),
//             ('05:00', '06:00'),
//             ('06:00', '07:00'),
//             ('07:00', '08:00'),
//             ('08:00', '09:00'),
//             ('09:00', '10:00'),
//             ('10:00', '11:00'),
//             ('11:00', '12:00'),
//             ('12:00', '13:00'),
//             ('13:00', '14:00'),
//             ('14:00', '15:00'),
//             ('15:00', '15:48'),
//             ('15:48', '16:00'),
//             ('16:00', '17:00'),
//             ('17:00', '18:00'),
//             ('18:00', '19:00'),
//             ('19:00', '20:00'),
//             ('20:00', '21:00'),
//             ('21:00', '22:00'),
//             ('22:00', '23:00'),
//             ('23:00', '00:00'),
//             ('00:00', '01:09')
//         ) AS t(hora_inicio, hora_fim)
//     ),

//     -- Converte para timestamp real do dia produtivo e adiciona coluna de string do intervalo
//     intervalos_ts AS (
//         SELECT
//             CASE
//                 WHEN hora_inicio::time >= '00:00' AND hora_inicio::time < '01:09' THEN (date_trunc('day', now() + interval '1 day') + hora_inicio::time)
//                 ELSE (date_trunc('day', now()) + hora_inicio::time)
//             END AS ts_inicio,
//             CASE
//                 WHEN hora_fim::time >= '00:00' AND hora_fim::time <= '01:09' THEN (date_trunc('day', now() + interval '1 day') + hora_fim::time)
//                 ELSE (date_trunc('day', now()) + hora_fim::time)
//             END AS ts_fim,
//             hora_inicio || '-' || hora_fim AS intervalo
//         FROM intervalos
//     )

//     -- Conta os CIS distintos OK e KO por intervalo
//     SELECT
//         ts_inicio,
//         ts_fim,
//       intervalo,
//         COUNT(DISTINCT CASE WHEN label = 'ok' THEN cis END) AS ok,
//         COUNT(DISTINCT CASE WHEN label = 'ko' THEN cis END) AS ko
//     FROM intervalos_ts i
//     LEFT JOIN dia_produtivo d
//       ON to_timestamp(d._timestamp/1000) >= i.ts_inicio
//     AND to_timestamp(d._timestamp/1000) < i.ts_fim
//     GROUP BY intervalo, ts_inicio, ts_fim
//     ORDER BY ts_inicio;

//     `,
//     Semanas: `
//       WITH semanas AS (
//           SELECT
//               generate_series(
//                   date_trunc('week', now()) - interval '3 week' - interval '1 day',
//                   date_trunc('week', now()) - interval '1 day',
//                   interval '1 week'
//               ) AS domingo_00
//       ),

//       turnos_semana AS (
//           SELECT
//               s.domingo_00,
//               g.turno,
//               g.ts_inicio,
//               g.ts_fim
//           FROM semanas s
//           CROSS JOIN LATERAL (
//               VALUES
//                   (2, s.domingo_00 + interval '20 hours', s.domingo_00 + interval '1 day 1 hour 9 minutes'),
//                   (1, s.domingo_00 + interval '1 day 6 hours',  s.domingo_00 + interval '1 day 15 hours 48 minutes'),
//                   (2, s.domingo_00 + interval '1 day 15 hours 48 minutes', s.domingo_00 + interval '2 day 1 hour 9 minutes'),
//                   (3, s.domingo_00 + interval '1 day 1 hour 9 minutes', s.domingo_00 + interval '1 day 6 hours'),
//                   (1, s.domingo_00 + interval '2 day 6 hours',  s.domingo_00 + interval '2 day 15 hours 48 minutes'),
//                   (2, s.domingo_00 + interval '2 day 15 hours 48 minutes', s.domingo_00 + interval '3 day 1 hour 9 minutes'),
//                   (3, s.domingo_00 + interval '2 day 1 hour 9 minutes', s.domingo_00 + interval '2 day 6 hours'),
//                   (1, s.domingo_00 + interval '3 day 6 hours',  s.domingo_00 + interval '3 day 15 hours 48 minutes'),
//                   (2, s.domingo_00 + interval '3 day 15 hours 48 minutes', s.domingo_00 + interval '4 day 1 hour 9 minutes'),
//                   (3, s.domingo_00 + interval '3 day 1 hour 9 minutes', s.domingo_00 + interval '3 day 6 hours'),
//                   (1, s.domingo_00 + interval '4 day 6 hours',  s.domingo_00 + interval '4 day 15 hours 48 minutes'),
//                   (2, s.domingo_00 + interval '4 day 15 hours 48 minutes', s.domingo_00 + interval '5 day 1 hour 9 minutes'),
//                   (3, s.domingo_00 + interval '4 day 1 hour 9 minutes', s.domingo_00 + interval '4 day 6 hours'),
//                   (1, s.domingo_00 + interval '5 day 6 hours',  s.domingo_00 + interval '5 day 15 hours 48 minutes'),
//                   (2, s.domingo_00 + interval '5 day 15 hours 48 minutes', s.domingo_00 + interval '6 day 1 hour 9 minutes'),
//                   (3, s.domingo_00 + interval '5 day 1 hour 9 minutes', s.domingo_00 + interval '5 day 6 hours'),
//                   (1, s.domingo_00 + interval '6 day 6 hours',  s.domingo_00 + interval '6 day 15 hours 48 minutes'),
//                   (2, s.domingo_00 + interval '6 day 15 hours 48 minutes', s.domingo_00 + interval '7 day 1 hour 9 minutes'),
//                   (3, s.domingo_00 + interval '6 day 1 hour 9 minutes', s.domingo_00 + interval '6 day 6 hours')
//           ) AS g(turno, ts_inicio, ts_fim)
//       )

//       -- soma individual e total "all"
//       SELECT
//           EXTRACT(WEEK FROM t.domingo_00)::int AS semana_iso,
//           t.turno::text AS turno,
//           COUNT(DISTINCT CASE WHEN s.label = 'ok' THEN s.cis END) AS ok,
//           COUNT(DISTINCT CASE WHEN s.label = 'ko' THEN s.cis END) AS ko,
//           MIN(t.ts_inicio) AS semana_inicio,
//           MAX(t.ts_fim) AS semana_fim,
//           CONCAT('Semana ', EXTRACT(WEEK FROM t.domingo_00)::int) AS intervalo
//       FROM turnos_semana t
//       LEFT JOIN public.savision_puntone s
//         ON to_timestamp(s._timestamp/1000) >= t.ts_inicio
//       AND to_timestamp(s._timestamp/1000) < t.ts_fim
//       GROUP BY t.domingo_00, t.turno

//       UNION ALL

//       -- total de todos os turnos ("all")
//       SELECT
//           EXTRACT(WEEK FROM t.domingo_00)::int AS semana_iso,
//           'all' AS turno,
//           COUNT(DISTINCT CASE WHEN s.label = 'ok' THEN s.cis END) AS ok,
//           COUNT(DISTINCT CASE WHEN s.label = 'ko' THEN s.cis END) AS ko,
//           MIN(t.ts_inicio) AS semana_inicio,
//           MAX(t.ts_fim) AS semana_fim,
//           CONCAT('Semana ', EXTRACT(WEEK FROM t.domingo_00)::int) AS intervalo
//       FROM turnos_semana t
//       LEFT JOIN public.savision_puntone s
//         ON to_timestamp(s._timestamp/1000) >= t.ts_inicio
//       AND to_timestamp(s._timestamp/1000) < t.ts_fim
//       GROUP BY t.domingo_00

//       ORDER BY semana_iso, turno;
//     `,
//     DiasDaSemana: `
//       WITH params AS (
//           SELECT NULL::int AS turno -- coloque 1,2,3 ou NULL
//       ),

//       inicio_semana AS (
//           SELECT date_trunc('week', now()) - interval '1 day' AS domingo_00
//       ),

//       turnos AS (
//           SELECT
//               g.dia,
//               g.turno,
//               g.ts_inicio,
//               g.ts_fim
//           FROM inicio_semana s
//           CROSS JOIN LATERAL (
//               VALUES
//                   ('Domingo', 2, s.domingo_00 + interval '20 hours', s.domingo_00 + interval '1 day 1 hour 9 minutes'),
//                   ('Segunda', 1, s.domingo_00 + interval '1 day 6 hours',  s.domingo_00 + interval '1 day 15 hours 48 minutes'),
//                   ('Segunda', 2, s.domingo_00 + interval '1 day 15 hours 48 minutes', s.domingo_00 + interval '2 day 1 hour 9 minutes'),
//                   ('Segunda', 3, s.domingo_00 + interval '1 day 1 hour 9 minutes', s.domingo_00 + interval '1 day 6 hours'),
//                   ('Terça', 1, s.domingo_00 + interval '2 day 6 hours',  s.domingo_00 + interval '2 day 15 hours 48 minutes'),
//                   ('Terça', 2, s.domingo_00 + interval '2 day 15 hours 48 minutes', s.domingo_00 + interval '3 day 1 hour 9 minutes'),
//                   ('Terça', 3, s.domingo_00 + interval '2 day 1 hour 9 minutes', s.domingo_00 + interval '2 day 6 hours'),
//                   ('Quarta', 1, s.domingo_00 + interval '3 day 6 hours',  s.domingo_00 + interval '3 day 15 hours 48 minutes'),
//                   ('Quarta', 2, s.domingo_00 + interval '3 day 15 hours 48 minutes', s.domingo_00 + interval '4 day 1 hour 9 minutes'),
//                   ('Quarta', 3, s.domingo_00 + interval '3 day 1 hour 9 minutes', s.domingo_00 + interval '3 day 6 hours'),
//                   ('Quinta', 1, s.domingo_00 + interval '4 day 6 hours',  s.domingo_00 + interval '4 day 15 hours 48 minutes'),
//                   ('Quinta', 2, s.domingo_00 + interval '4 day 15 hours 48 minutes', s.domingo_00 + interval '5 day 1 hour 9 minutes'),
//                   ('Quinta', 3, s.domingo_00 + interval '4 day 1 hour 9 minutes', s.domingo_00 + interval '4 day 6 hours'),
//                   ('Sexta', 1, s.domingo_00 + interval '5 day 6 hours',  s.domingo_00 + interval '5 day 15 hours 48 minutes'),
//                   ('Sexta', 2, s.domingo_00 + interval '5 day 15 hours 48 minutes', s.domingo_00 + interval '6 day 1 hour 9 minutes'),
//                   ('Sexta', 3, s.domingo_00 + interval '5 day 1 hour 9 minutes', s.domingo_00 + interval '5 day 6 hours'),
//                   ('Sábado', 1, s.domingo_00 + interval '6 day 6 hours',  s.domingo_00 + interval '6 day 15 hours 48 minutes'),
//                   ('Sábado', 2, s.domingo_00 + interval '6 day 15 hours 48 minutes', s.domingo_00 + interval '7 day 1 hour 9 minutes'),
//                   ('Sábado', 3, s.domingo_00 + interval '6 day 1 hour 9 minutes', s.domingo_00 + interval '6 day 6 hours')
//           ) AS g(dia, turno, ts_inicio, ts_fim)
//           JOIN params p ON (p.turno IS NULL OR p.turno = g.turno)
//       )

//       -- turnos individuais
//       SELECT
//           t.dia,
//           t.turno::text AS turno,
//           COUNT(DISTINCT CASE WHEN s.label = 'ok' THEN s.cis END) AS ok,
//           COUNT(DISTINCT CASE WHEN s.label = 'ko' THEN s.cis END) AS ko,
//           MIN(t.ts_inicio) AS ts_inicio,
//           MAX(t.ts_fim) AS ts_fim,
//           CONCAT(TO_CHAR(MIN(t.ts_inicio), 'DD/MM HH24:MI'),
//                 ' - ',
//                 TO_CHAR(MAX(t.ts_fim), 'DD/MM HH24:MI')) AS intervalo
//       FROM turnos t
//       LEFT JOIN public.savision_puntone s
//         ON to_timestamp(s._timestamp/1000) >= t.ts_inicio
//       AND to_timestamp(s._timestamp/1000) < t.ts_fim
//       GROUP BY t.dia, t.turno

//       UNION ALL

//       -- turno "all" (soma dos 3 turnos)
//       SELECT
//           t.dia,
//           'all' AS turno,
//           COUNT(DISTINCT CASE WHEN s.label = 'ok' THEN s.cis END) AS ok,
//           COUNT(DISTINCT CASE WHEN s.label = 'ko' THEN s.cis END) AS ko,
//           MIN(t.ts_inicio) AS ts_inicio,
//           MAX(t.ts_fim) AS ts_fim,
//           CONCAT(TO_CHAR(MIN(t.ts_inicio), 'DD/MM HH24:MI'),
//                 ' - ',
//                 TO_CHAR(MAX(t.ts_fim), 'DD/MM HH24:MI')) AS intervalo
//       FROM turnos t
//       LEFT JOIN public.savision_puntone s
//         ON to_timestamp(s._timestamp/1000) >= t.ts_inicio
//       AND to_timestamp(s._timestamp/1000) < t.ts_fim
//       GROUP BY t.dia

//       ORDER BY ts_inicio, turno;
//     `,
//   };

//   const results = {};

//   try {
//     // Executa cada query e salva no objeto results
//     for (const [key, sql] of Object.entries(queries)) {
//       const { rows } = await pool.query(sql);
//       if (key === "resumoTurnos") {
//         results[key] = transformarResumoTurnos(rows);
//       } else if (key === "Semanas") {
//         results[key] = transformarSemanas(rows);
//       } else if (key === "DiasDaSemana") {
//         results[key] = transformarDiasDaSemana(rows);
//       } else if (key === "Horaria") {
//         results[key] = transformarHoraria(rows);
//       } else {
//         results[key] = rows;
//       }
//     }
//     return results;
//   } catch (err) {
//     console.error("Erro na consulta resumo:", err);
//     return {
//       resumoTurnos: [],
//       queryHoraria: [],
//       querySemanas: [],
//       queryDiasDaSemana: [],
//     };
//   }
// }

// export async function queryProductionReport(date, line) {
//   try {
//     const dailySummaryQuery = `
//       SELECT * FROM get_daily_production_summary($1, $2);
//     `;

//     const hourlyQuery = `
//      SELECT * FROM get_hourly_prod_and_losses_cars($1, $2);
//     `;

//     // Nova query para obter a losses table
//     const lossesTableQuery = `
//       SELECT *
//       FROM public.get_losses_table($1, $2)
//       WHERE reasondesc <> 'Parada Por Medida De Segurança'
//         AND reasondesc <> 'Parada Por Erros De Congruência';
//     `;

//     // Executa todas as queries
//     const [dailyRes, hourlyRes, lossesTableRes] = await Promise.all([
//       pool.query(dailySummaryQuery, [line, date]),
//       pool.query(hourlyQuery, [date, line]),
//       pool.query(lossesTableQuery, [date, line]),
//     ]);

//     // ===== RESULTADO FINAL =====
//     const result = {};

//     // DAILY SUMMARY
//     dailyRes.rows.forEach((row) => {
//       const turno = row.turno;
//       if (!result[turno])
//         result[turno] = { dailySummary: {}, hourlyData: {}, lossesTable: [] };
//       Object.entries(row).forEach(([col, val]) => {
//         if (col !== "turno") result[turno].dailySummary[col] = val ?? 0;
//       });
//     });

//     // HOURLY DATA
//     hourlyRes.rows.forEach((row) => {
//       const turno = row.turno;
//       if (!result[turno])
//         result[turno] = { dailySummary: {}, hourlyData: {}, lossesTable: [] };

//       const hourly = result[turno].hourlyData;
//       if (!hourly.intervalo) {
//         hourly.intervalo = [];
//         hourly.reasondesc = [];
//         hourly.valor = [];
//         hourly.ts_inicio = [];
//       }

//       hourly.intervalo.push(row.intervalo);
//       hourly.reasondesc.push(row.reasondesc);
//       hourly.valor.push(Number(row.valor ?? 0));
//       hourly.ts_inicio.push(row.ts_inicio);
//     });

//     // LOSSES TABLE DATA - Agrupar por turno
//     lossesTableRes.rows.forEach((row) => {
//       const turno = row.turno;
//       if (!result[turno])
//         result[turno] = { dailySummary: {}, hourlyData: {}, lossesTable: [] };

//       // Incluir todos os campos da losses table
//       result[turno].lossesTable.push({
//         turno: row.turno,
//         reasondesc: row.reasondesc,
//         element: row.element,
//         station: row.station,
//         alarm: row.alarm,
//         ocorrencias: Number(row.ocorrencias ?? 0),
//         total_losstime_minutes: Number(row.total_losstime_minutes ?? 0),
//         // Incluir qualquer outro campo que possa existir
//         ...row,
//       });
//     });

//     // CRIAR TOTAL GERAL
//     result["Total"] = {
//       dailySummary: result.Total?.dailySummary || {},
//       hourlyData: { intervalo: [], reasondesc: [], valor: [], ts_inicio: [] },
//       lossesTable: [],
//     };

//     // Ordem desejada: Turno 3, Turno 2, Turno 1
//     const turnosOrdenados = ["TURNO 3", "TURNO 1", "TURNO 2"].filter(
//       (turno) => result[turno],
//     );

//     // Agregar dados dos turnos na ordem correta
//     turnosOrdenados.forEach((turno) => {
//       const hourlyData = result[turno].hourlyData;

//       hourlyData.intervalo.forEach((intervalo, index) => {
//         result["Total"].hourlyData.intervalo.push(intervalo);
//         result["Total"].hourlyData.reasondesc.push(
//           hourlyData.reasondesc[index],
//         );
//         result["Total"].hourlyData.valor.push(hourlyData.valor[index]);
//         result["Total"].hourlyData.ts_inicio.push(hourlyData.ts_inicio[index]);
//       });
//     });

//     const totalLossesMap = new Map();

//     turnosOrdenados.forEach((turno) => {
//       const lossesTable = result[turno].lossesTable || [];
//       const seenAlarms = new Set();

//       lossesTable.forEach((loss, index) => {
//         const key = loss.alarm;

//         if (!seenAlarms.has(key)) {
//           seenAlarms.add(key);

//           if (totalLossesMap.has(key)) {
//             const existing = totalLossesMap.get(key);
//             existing.ocorrencias =
//               Number(existing.ocorrencias || 0) + Number(loss.ocorrencias || 0);
//             existing.total_losstime_minutes =
//               Number(existing.total_losstime_minutes || 0) +
//               Number(loss.total_losstime_minutes || 0);
//           } else {
//             totalLossesMap.set(key, {
//               turno: "Total",
//               reasondesc: loss.reasondesc,
//               element: loss.element,
//               station: loss.station,
//               alarm: loss.alarm,
//               ocorrencias: Number(loss.ocorrencias || 0),
//               total_losstime_minutes: Number(loss.total_losstime_minutes || 0),
//             });
//           }
//         }
//       });
//     });

//     // Converter o Map para array e ordenar por total_losstime_minutes (decrescente)
//     result["Total"].lossesTable = Array.from(totalLossesMap.values()).sort(
//       (a, b) => b.total_losstime_minutes - a.total_losstime_minutes,
//     );

//     // Se quiser também agregar o dailySummary no Total:
//     turnosOrdenados.forEach((turno) => {
//       const dailySummary = result[turno].dailySummary;
//       Object.keys(dailySummary).forEach((key) => {
//         if (typeof dailySummary[key] === "number") {
//           result["Total"].dailySummary[key] =
//             (result["Total"].dailySummary[key] || 0) + dailySummary[key];
//         }
//       });
//     });

//     // ===== CRIAR lossesSummary POR TURNO (ordenado por cars) =====
//     Object.keys(result).forEach((turno) => {
//       const hourly = result[turno].hourlyData;
//       if (!hourly || !hourly.reasondesc) return;

//       // Agrupa os valores de cars por reasonDesc
//       const summaryMap = {};
//       hourly.reasondesc.forEach((reason, i) => {
//         const val = hourly.valor[i] ?? 0;
//         summaryMap[reason] = (summaryMap[reason] || 0) + val;
//       });

//       // Converte para array e ordena decrescentemente por cars
//       const orderedSummary = Object.entries(summaryMap)
//         .map(([reason, cars]) => ({ reason, cars }))
//         .sort((a, b) => b.cars - a.cars);

//       result[turno].lossesSummary = orderedSummary;
//     });

//     return result;
//   } catch (err) {
//     console.error("Erro ao consultar dados de produção:", err);
//     throw err;
//   }
// }

// // CAP
// export async function queryCapAlarms(line, timestampRange) {
//   try {
//     const startTimestamp = timestampRange[0];
//     const endTimestamp = timestampRange[1];
//     // console.log("aqui: ", startTimestamp, endTimestamp);

//     const query = `
//       SELECT *
//       FROM cap.cap_get_line_status_history(
//         $1::timestamp,
//         $2::timestamp,
//         $3::text
//       );
//     `;

//     const result = await pool.query(query, [
//       startTimestamp,
//       endTimestamp,
//       line,
//     ]);

//     const normalizedRows = result.rows.map((row) => ({
//       ...row,
//       losstime_min: parseFloat(row.losstime_min) || 0,
//     }));

//     return normalizedRows;
//   } catch (err) {
//     console.error("Erro ao consultar cap alarms:", err);
//     throw err;
//   }
// }

// export async function criarJustificativa(data) {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const {
//       alarmsid,
//       causaRaiz,
//       comentario,
//       dataSelecionada,
//       descricao,
//       duracaoTotal,
//       horaSelecionada,
//       linha,
//       maquina,
//       matricula,
//       componente,
//     } = data;

//     // 1️⃣ Buscar responsável pela causa raiz
//     const responsavelQuery = `
//       SELECT responsavel
//       FROM cap.dim_responsavel_causaraiz
//       WHERE causa_raiz = $1
//       LIMIT 1
//     `;

//     const responsavelRes = await client.query(responsavelQuery, [causaRaiz]);

//     const validador =
//       responsavelRes.rows.length > 0
//         ? responsavelRes.rows[0].responsavel
//         : null; // se não achar, deixa null ou coloca fallback se quiser

//     //  Inserir justificativa
//     const insertJustQuery = `
//       INSERT INTO cap.dim_justificativa
//       (data, horaselecionada, linha, matricula_criador, created_at, idstatus, causa_raiz, validador, dur_min, descricao,ts_inicio, componente)
//       VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10::timestamp + split_part($2, ' - ', 1)::time,$11)
//       RETURNING id
//     `;

//     const { rows } = await client.query(insertJustQuery, [
//       dataSelecionada,
//       horaSelecionada,
//       linha,
//       matricula,
//       0,
//       causaRaiz,
//       validador,
//       duracaoTotal,
//       descricao,
//       dataSelecionada,
//       componente,
//     ]);

//     const justificativaId = rows[0].id;

//     //  Inserir histórico
//     const insertHistQuery = `
//     INSERT INTO cap.historico_justificativa
//     (
//       id_justificativa,
//       data,
//       horaselecionada,
//       linha,
//       matricula,
//       causa_raiz,
//       comentario,
//       descricao,
//       duracao_total,
//       maquina,
//       alarmsid,
//       componente,
//       created_at
//     )
//     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
//   `;

//     await client.query(insertHistQuery, [
//       justificativaId,
//       dataSelecionada,
//       horaSelecionada,
//       linha,
//       matricula,
//       causaRaiz,
//       comentario,
//       descricao,
//       duracaoTotal,
//       maquina,
//       alarmsid, // array direto
//       componente,
//     ]);

//     // 3️⃣ Inserir cada alarmId
//     const insertAlarm = `
//   INSERT INTO cap.dim_alarmesjustificados
//   (id_justificativa, alarmsid, data, horaselecionada)
//   VALUES ($1, $2, $3, $4)
// `;

//     for (const alarmId of alarmsid) {
//       await client.query(insertAlarm, [
//         justificativaId,
//         alarmId, // agora BIGINT
//         dataSelecionada, // formato YYYY-MM-DD (string) OU JS Date
//         horaSelecionada, // exemplo: "11:00 - 12:00"
//       ]);
//     }

//     await client.query("COMMIT");

//     return {
//       id: justificativaId,
//       message: "Justificativa criada com sucesso",
//     };
//   } catch (err) {
//     await client.query("ROLLBACK");
//     console.error("Erro ao criar justificativa:", err);
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// export async function getHistoricoJustificativa(idJustificativa) {
//   const client = await pool.connect();

//   try {
//     const { rows } = await client.query(
//       `
//       SELECT
//           h.*,                                 -- histórico completo
//           u.nome AS criador_nome,
//           u.area AS criador_area,
//           d.responsavel,

//           dj.idstatus,                          -- status atual da justificativa
//           dj.validador,
//           sj.status,                            -- status (ex: Validado, Reprovado)
//           sj.nome AS textstatus                 -- nome do status (renomeado)

//       FROM cap.historico_justificativa h

//       -- JOIN para pegar dados do criador
//       LEFT JOIN auth.usuarios u
//           ON h.matricula = u.matricula

//       -- JOIN para pegar responsável pela causa raiz
//       LEFT JOIN cap.dim_responsavel_causaraiz d
//           ON d.causa_raiz = h.causa_raiz

//       -- JOIN para pegar dados gerais da justificativa (incluindo idstatus)
//       LEFT JOIN cap.dim_justificativa dj
//           ON dj.id = h.id_justificativa

//       -- JOIN para traduzir o status (texto)
//       LEFT JOIN cap.dim_statusjustificativas sj
//           ON sj.id = dj.idstatus

//       WHERE
//           h.id_justificativa = $1
//       ORDER BY
//           h.created_at DESC;

//       `,
//       [idJustificativa],
//     );

//     return rows;
//   } finally {
//     client.release();
//   }
// }

// export async function listarJustificativas(filtros = {}) {
//   const client = await pool.connect();

//   try {
//     const {
//       linha,
//       dataSelecionada,
//       horaSelecionada,
//       causaRaiz,
//       matricula,
//       maquina,
//     } = filtros;

//     let query = `
//       SELECT
//           h.*,
//           r.responsavel,
//           s.status as textstatus,
//           s.nome AS status,
//           j.validador
//       FROM cap.historico_justificativa h
//       LEFT JOIN cap.dim_justificativa j
//           ON h.id_justificativa = j.id          -- pega o status via dim_justificativa
//       LEFT JOIN cap.dim_responsavel_causaraiz r
//           ON j.causa_raiz = r.causa_raiz
//       LEFT JOIN cap.dim_statusjustificativas s
//           ON j.idstatus = s.id                  -- nome amigável do status
//       INNER JOIN (
//           -- pega a última edição de cada justificativa
//           SELECT id_justificativa, MAX(created_at) AS max_created
//           FROM cap.historico_justificativa
//           GROUP BY id_justificativa
//       ) last_hist
//           ON h.id_justificativa = last_hist.id_justificativa
//           AND h.created_at = last_hist.max_created
//     `;

//     const conditions = [];
//     const values = [];

//     if (linha) {
//       values.push(linha);
//       conditions.push(`h.linha = $${values.length}`);
//     }
//     if (dataSelecionada) {
//       values.push(dataSelecionada);
//       conditions.push(`h.data = $${values.length}`);
//     }
//     if (horaSelecionada) {
//       values.push(horaSelecionada);
//       conditions.push(`h.horaselecionada = $${values.length}`);
//     }
//     if (causaRaiz) {
//       values.push(causaRaiz);
//       conditions.push(`h.causa_raiz = $${values.length}`);
//     }
//     if (matricula) {
//       values.push(matricula);
//       conditions.push(`h.matricula = $${values.length}`);
//     }
//     if (maquina) {
//       values.push(maquina);
//       conditions.push(`h.maquina = $${values.length}`);
//     }

//     if (conditions.length > 0) {
//       query += " WHERE " + conditions.join(" AND ");
//     }

//     query += " ORDER BY h.data DESC, h.horaselecionada ASC";

//     const { rows } = await client.query(query, values);
//     return rows;
//   } catch (err) {
//     console.error("Erro ao listar justificativas:", err);
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// export async function getResponsaveis() {
//   try {
//     const query = `
//       SELECT *
//       FROM cap.dim_responsavel;
//     `;

//     const { rows } = await pool.query(query);

//     return rows;
//   } catch (err) {
//     console.error("Erro ao consultar responsáveis:", err);
//     throw err;
//   }
// }

// export async function listarValidacaoPendencias(filtros = {}) {
//   const justificativas = await listarJustificativas(filtros);
//   const responsaveisDim = await getResponsaveis(); // [{id:1,responsavel:"PRODUÇÃO"}, ...]

//   // Criar estrutura inicial com todos os responsáveis da dim
//   const resultado = {};
//   responsaveisDim.forEach((r) => {
//     resultado[r.responsavel] = {
//       // items[0] = Pendentes/Em Revisão, items[1] = Finalizadas
//       items: [[], []],
//       resumo: [
//         { quantidade: 0, perdas: 0 }, // status != FINALIZADA
//         { quantidade: 0, perdas: 0 }, // status == FINALIZADA
//       ],
//     };
//   });

//   // Preencher com as justificativas existentes
//   justificativas.forEach((j) => {
//     const validador = j.validador || "Sem Validador";

//     const responsavelKey =
//       responsaveisDim.find((r) => r.responsavel === validador)?.responsavel ||
//       validador;

//     if (!resultado[responsavelKey]) {
//       resultado[responsavelKey] = {
//         items: [[], []],
//         resumo: [
//           { quantidade: 0, perdas: 0 },
//           { quantidade: 0, perdas: 0 },
//         ],
//       };
//     }

//     // Determina índice baseado no status

//     const isFinalizada = j.status === "Finalizada";

//     const index = isFinalizada ? 1 : 0;

//     // Adiciona item no grupo correto
//     resultado[responsavelKey].items[index].push({
//       id_justificativa: j.id_justificativa,
//       linha: j.linha,
//       maquina: j.maquina,
//       duracao_total: j.duracao_total,
//       responsavel: j.responsavel, // quem abriu a justificativa
//       status: j.status,
//       textstatus: j.textstatus,
//     });

//     // Atualiza resumo correspondente
//     resultado[responsavelKey].resumo[index].quantidade += 1;
//     resultado[responsavelKey].resumo[index].perdas += parseFloat(
//       j.duracao_total,
//     );
//   });

//   return resultado;
// }

// export async function listarJustificativasPendencias(filtros = {}) {
//   try {
//     const { dataSelecionada, ute, turno, line, justificado } = filtros;

//     let query = `
//       SELECT
//         line,
//         ute,
//         turno,
//         ts_inicio,
//         justificado
//       FROM cap.mv_justificado_ultimos_2_dias
//     `;

//     const conditions = [];
//     const values = [];

//     if (line) {
//       values.push(line);
//       conditions.push(`line = $${values.length}`);
//     }

//     if (ute) {
//       values.push(ute);
//       conditions.push(`ute = $${values.length}`);
//     }

//     if (turno) {
//       values.push(turno);
//       conditions.push(`turno = $${values.length}`);
//     }

//     if (dataSelecionada) {
//       values.push(dataSelecionada);
//       conditions.push(`DATE(ts_inicio) = $${values.length}`);
//     }

//     if (typeof justificado === "boolean") {
//       values.push(justificado);
//       conditions.push(`justificado = $${values.length}`);
//     }

//     if (conditions.length > 0) {
//       query += " WHERE " + conditions.join(" AND ");
//     }

//     query += `
//       ORDER BY ts_inicio DESC, line ASC
//     `;

//     // 👉 aqui está o que você queria
//     const { rows } = await pool.query(query, values);
//     return rows;
//   } catch (err) {
//     console.error("Erro ao listar justificativas pendentes:", err);
//     throw err;
//   }
// }

// export async function listarMaquinas(filtros = {}) {
//   const client = await pool.connect();

//   try {
//     const { linha, maquina } = filtros;

//     let query = `
//       SELECT
//           m_maquina,
//           linha,
//           maquina || ' - ' || tipologia AS maquina
//       FROM cap.dim_maquina
//     `;

//     const conditions = [];
//     const values = [];

//     if (linha) {
//       values.push(linha);
//       conditions.push(`linha = $${values.length}`);
//     }

//     if (maquina) {
//       values.push(maquina);
//       conditions.push(`maquina = $${values.length}`);
//     }

//     if (conditions.length > 0) {
//       query += " WHERE " + conditions.join(" AND ");
//     }

//     query += " ORDER BY linha, maquina";

//     const { rows } = await client.query(query, values);
//     return rows;
//   } catch (err) {
//     console.error("Erro ao listar máquinas:", err);
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// AUTENTICAÇÃO LOGIN




/**
 * Busca usuário pelo campo matricula
 */

// Retorna usuário pelo matricula
export async function getUserByMatricula(matricula) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT matricula, nome, area, ute, cresp, cargo, turno, password_hash, ativo, ultimo_login
      FROM auth.usuarios
      WHERE matricula = $1
      LIMIT 1
    `;
    const { rows } = await client.query(query, [matricula]);
    return rows[0] || null;
  } catch (err) {
    console.error("Erro getUserByMatricula:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Atualiza usuário pela matricula
export async function updateUser(matricula, data) {
  const client = await pool.connect();
  try {
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in data) {
      fields.push(`${key} = $${i}`);
      values.push(data[key]);
      i++;
    }

    if (fields.length === 0) return getUserByMatricula(matricula);

    const query = `
      UPDATE auth.usuarios
      SET ${fields.join(", ")}
      WHERE matricula = $${i}
      RETURNING matricula, nome, area, ute, cresp, cargo, turno, ativo, ultimo_login
    `;
    values.push(matricula);

    const { rows } = await client.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("Erro updateUser:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Cria novo usuário
export async function createUser({ matricula, nome, senha, ...rest }) {
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO auth.usuarios (
        matricula, nome, password_hash, ativo, ultimo_login${Object.keys(rest).length ? ", " + Object.keys(rest).join(", ") : ""}
      )
      VALUES (
        $1, $2, $3, true, NOW()${
          Object.keys(rest).length
            ? ", " +
              Object.keys(rest)
                .map((_, i) => `$${i + 4}`)
                .join(", ")
            : ""
        }
      )
      RETURNING matricula, nome, ativo, ultimo_login
    `;
    const values = [matricula, nome, hash, ...Object.values(rest)];
    const { rows } = await client.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("Erro createUser:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function createUser2({
  matricula,
  nome,
  sobrenome,
  area,
  password_hash,
}) {
  const client = await pool.connect();
  try {
    // Cria nome completo em UPPERCASE
    const nomeCompleto = `${nome} ${sobrenome}`.toUpperCase();

    const query = `
      INSERT INTO auth.usuarios (matricula, nome, area, password_hash, ativo)
      VALUES ($1, $2, $3, $4, true)
      RETURNING matricula, nome, area, ativo
    `;

    const values = [matricula, nomeCompleto, area, password_hash];

    const { rows } = await client.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("Erro createUser:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function reprovarJustificativa(id_justificativa, novosDados) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      matricula,
      responsavel_antigo,
      causa_raiz,
      comentario,
      descricao,
      duracao_total,
      maquina,
      alarmsid,
      data,
      horaselecionada,
      linha,
      componente,
    } = novosDados;

    // 1️⃣ Validar área do usuário que está reprovendo
    const userQuery = `SELECT area FROM auth.usuarios WHERE matricula = $1`;
    const userRes = await client.query(userQuery, [matricula]);
    if (userRes.rows.length === 0)
      return { ok: false, message: "Usuário não encontrado" };
    const userArea = userRes.rows[0].area;

    if (userArea !== responsavel_antigo) {
      return {
        ok: false,
        message: "Usuário não tem permissão para reprovar esta justificativa",
      };
    }

    // 2️⃣ Buscar justificativa atual
    const justQuery = `
      SELECT id, idstatus, validador, causa_raiz
      FROM cap.dim_justificativa
      WHERE id = $1
    `;
    const justRes = await client.query(justQuery, [id_justificativa]);
    if (justRes.rows.length === 0)
      return { ok: false, message: "Justificativa não encontrada" };
    const justificativaAtual = justRes.rows[0];

    // 3️⃣ Determinar novos valores de idstatus e validador
    let novoStatus, novoValidador;
    if (justificativaAtual.idstatus === 1) {
      // EM_REVISAO
      novoStatus = 0;
      novoValidador = matricula;
    } else if (justificativaAtual.idstatus === 0) {
      if (justificativaAtual.causa_raiz === causa_raiz) {
        // Aprovação direta
        await aprovarJustificativa(id_justificativa, novosDados);
        return { ok: true, message: "Justificativa alterada com sucesso" };
      } else {
        // PENDENTE_VALIDACAO
        novoStatus = 1;
        novoValidador = "PRODUÇÃO";
      }
    } else {
      return { ok: false, message: "Status atual não permite reprovação" };
    }

    // 4️⃣ Atualizar dim_justificativa
    const updateQuery = `
      UPDATE cap.dim_justificativa
      SET idstatus = $1,
          validador = $2,
          dur_min = $3,
          descricao = $4,
          causa_raiz = $5,
          componente = $6
      WHERE id = $7
    `;
    await client.query(updateQuery, [
      novoStatus,
      novoValidador,
      duracao_total,
      descricao,
      causa_raiz,
      componente,
      id_justificativa,
    ]);

    // 5️⃣ Inserir histórico
    const insertHistQuery = `
      INSERT INTO cap.historico_justificativa
      (id_justificativa, data, horaselecionada, linha, matricula, causa_raiz, comentario, descricao, duracao_total, maquina, alarmsid,componente, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
    `;
    await client.query(insertHistQuery, [
      id_justificativa,
      data,
      horaselecionada,
      linha,
      matricula,
      causa_raiz,
      comentario,
      descricao,
      Number(duracao_total),
      maquina,
      alarmsid,
      componente,
    ]);

    await client.query("COMMIT");

    return { ok: true, message: "Justificativa alterada com sucesso" };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao reprovar justificativa:", err);
    return { ok: false, message: err.message || "Erro interno" };
  } finally {
    client.release();
  }
}

export async function aprovarJustificativa(id_justificativa, novosDados) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log(novosDados);

    const {
      matricula,
      causa_raiz,
      descricao,
      duracao_total,
      maquina,
      alarmsid,
      data,
      horaselecionada,
      linha,
      responsavel_antigo,
      comentario,
      componente,
    } = novosDados;

    // 1️⃣ Validar área do usuário que está reprovendo
    console.log(matricula);
    const userQuery = `SELECT area FROM auth.usuarios WHERE matricula = $1`;
    const userRes = await client.query(userQuery, [matricula]);
    if (userRes.rows.length === 0)
      return { ok: false, message: "Usuário não encontrado" };
    const userArea = userRes.rows[0].area;

    // 2️⃣ Buscar justificativa atual
    const justQuery = `
      SELECT id, idstatus, validador, causa_raiz
      FROM cap.dim_justificativa
      WHERE id = $1
    `;

    const justRes = await client.query(justQuery, [id_justificativa]);
    if (justRes.rows.length === 0)
      return { ok: false, message: "Justificativa não encontrada" };
    const justificativaAtual = justRes.rows[0];

    const validador = justificativaAtual.validador;

    if (userArea !== validador) {
      return {
        ok: false,
        message: "Usuário não tem permissão para aprovar esta justificativa",
      };
    }

    let novoStatus = 2;
    if (userArea !== responsavel_antigo) {
      novoStatus = 0;
    }

    console.log("novo status: ", novoStatus);

    // 3️⃣ Determinar novos valores de idstatus e validador

    // 4️⃣ Atualizar dim_justificativa
    const updateQuery = `
      UPDATE cap.dim_justificativa
      SET idstatus = $1, validador = $2
      WHERE id = $3
    `;
    await client.query(updateQuery, [
      novoStatus,
      responsavel_antigo,
      id_justificativa,
    ]);

    const comentarioFinal = novoStatus == 2 ? "Justificativa Validada" : null;

    const insertHistQuery = `
  INSERT INTO cap.historico_justificativa
  (id_justificativa, data, horaselecionada, linha, matricula, causa_raiz, comentario, descricao, duracao_total, maquina, alarmsid,componente, created_at)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
`;

    await client.query(insertHistQuery, [
      id_justificativa,
      data,
      horaselecionada,
      linha,
      matricula,
      causa_raiz,
      comentarioFinal,
      descricao,
      Number(duracao_total),
      maquina,
      alarmsid,
      componente,
    ]);

    await client.query("COMMIT");

    return { ok: true, message: "Justificativa validada com sucesso" };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao validar justificativa:", err);
    return { ok: false, message: err.message || "Erro interno" };
  } finally {
    client.release();
  }
}

export async function queryCapprodResumo(line, date) {
  const sql = `
    SELECT *
    FROM cap.cap_get_prod_and_losses_cars($1, $2)
    ORDER BY ts_inicio, reasonDesc;
  `;

  try {
    const { rows } = await pool.query(sql, [date, line]);
    return rows; // já está no formato final
  } catch (err) {
    console.error("Erro na consulta capprod resumo:", err);
    return [];
  }
}

export async function queryCapHistoricoJustificativas(startDate, endDate) {
  console.log(startDate);
  const sql = `
  SELECT 
    j.*,

    CASE 
        WHEN EXTRACT(HOUR FROM j.ts_inicio) BETWEEN 6 AND 15 THEN 1
        WHEN EXTRACT(HOUR FROM j.ts_inicio) BETWEEN 1 AND 5 THEN 3
        ELSE 2
    END AS turno,

    FLOOR(j.dur_min * 60.0 / NULLIF(l.tc_target, 0))::INT AS carros

  FROM cap.vw_justificativas_detalhadas j

  LEFT JOIN tc.dim_line l
    ON j.linha = l.line

  WHERE j.ts_inicio::date >= $1
  AND j.ts_inicio::date <= $2

  ORDER BY j.ts_inicio;
  `;

  try {
    const { rows } = await pool.query(sql, [startDate, endDate]);
    return rows;
  } catch (err) {
    console.error("Erro na consulta CAP histórico justificativas:", err);
    return [];
  }
}
