import { pool } from "../../../postgreConnect.js";
import { pgQueries } from "./geral.pgQueries.js";

// =============================
// BUILD WHERE DINÂMICO
// =============================
function buildWhere(filters) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (filters.startDate) {
    conditions.push(`date >= $${i++}`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push(`date <= $${i++}`);
    params.push(filters.endDate);
  }

  if (filters.event_id) {
    conditions.push(`event_id = $${i++}`);
    params.push(filters.event_id);
  }

  if (filters.line) {
    conditions.push(`line = $${i++}`);
    params.push(filters.line);
  }

  if (filters.maquina) {
    conditions.push(`maquina = $${i++}`);
    params.push(filters.maquina);
  }

  if (filters.linestation) {
    conditions.push(`linestation = $${i++}`);
    params.push(filters.linestation);
  }

  if (filters.tipo_maquina) {
    conditions.push(`tipo_maquina = $${i++}`);
    params.push(filters.tipo_maquina);
  }

  if (filters.ute?.length) {
    conditions.push(`ute = ANY($${i++})`);
    params.push(filters.ute);
  }

  if (filters.line_type === "TRANSPORTADORES") {
    conditions.push(`line_type = 'TRANSPORTADOR'`);
  }

  if (filters.line_type === "LINHAS PRODUTIVAS") {
    conditions.push(`line_type <> 'TRANSPORTADOR'`);
  }

  // Retorna APENAS as condições AND (sem WHERE)
  const whereClause = conditions.length
    ? " AND " + conditions.join(" AND ")
    : "";

  return { whereClause, params };
}

// =============================
// DASHBOARD
// =============================
export async function getDashboard(filters) {
  const { whereClause, params } = buildWhere(filters);

  // console.log("whereClause:", whereClause); // Debug
  // console.log("PARAMS:", params); // Debug
  // console.log("FILTERS:", filters); // Debug

  // =============================
  // TOP LINHAS
  // =============================
  const qTopLinhas = `
    SELECT *
    FROM (
      SELECT
        line,
        SUM(CASE WHEN reasondesc = 'Microparadas' THEN losstime ELSE 0 END)/60 AS micro,
        SUM(CASE WHEN reasondesc = 'Quebras' THEN losstime ELSE 0 END)/60 AS quebra,
        SUM(losstime)/60 AS total_loss 
      ${pgQueries.base}
      ${whereClause}
      GROUP BY line
    ) t
    ORDER BY (micro + quebra) DESC
    LIMIT 10;
  `;

  // =============================
  // TIPO MAQUINA (TOP ESTAÇÕES)
  // =============================
  const qTipoMaquina = `
    SELECT
      linestation,
      SUM(losstime)/60 AS loss_min
    ${pgQueries.base}
    ${whereClause}
    GROUP BY linestation
    ORDER BY loss_min DESC
    LIMIT 5;
  `;

  // =============================
  // TOP MAQUINAS
  // =============================
  const qTopMaquinas = `
    SELECT
      maquina,
      SUM(losstime)/60 AS loss_min
    ${pgQueries.base}
    ${whereClause}
    GROUP BY maquina
    ORDER BY loss_min DESC
    LIMIT 5;
  `;

  // =============================
  // TENDÊNCIA
  // =============================
  let qTendencia;
  let tendenciaParams = [...params];

  if (filters.nivel === "dia" && filters.semana) {
    qTendencia = `
      SELECT
        date AS periodo,
        SUM(losstime)/60 AS loss_min
      ${pgQueries.base}
      ${whereClause}
      ${whereClause ? "AND" : "WHERE"} DATE_TRUNC('week', date) = $${params.length + 1}
      GROUP BY date
      ORDER BY date;
    `;
    tendenciaParams.push(filters.semana);
  } else {
    qTendencia = `
      SELECT
      TO_CHAR(DATE_TRUNC('week', date), '"W"IW') AS periodo,
        SUM(losstime)/60 AS loss_min
      ${pgQueries.base}
      ${whereClause}
      GROUP BY 1
      ORDER BY 1;
    `;
  }

  // =============================
  // TABELA
  // =============================
  const qTabela = `
    SELECT
      line,
      maquina,
      station,
      element,
      component,
      event_id,
      alarm,
      COUNT(*) AS ocorrencias,
      SUM(losstime)/60 AS loss_min
    ${pgQueries.base}
    ${whereClause}
    GROUP BY line, station, element, component, event_id, alarm, maquina
    ORDER BY loss_min DESC
    LIMIT 100;
  `;

  // Execução das queries com logs
  // console.log("Query Completa Top Maquinas:", qTopMaquinas);
  // console.log("Query Completa Tipo Maquina:", qTipoMaquina);

  try {
    const [topLinhas, topMaquinas, tipoMaquina, tendencia, tabela] =
      await Promise.all([
        pool.query(qTopLinhas, params),
        pool.query(qTopMaquinas, params),
        pool.query(qTipoMaquina, params),
        pool.query(qTendencia, tendenciaParams),
        pool.query(qTabela, params),
      ]);

    return {
      topLinhas: topLinhas.rows,
      topMaquinas: topMaquinas.rows,
      tipoMaquina: tipoMaquina.rows,
      tendencia: tendencia.rows,
      tabela: tabela.rows,
    };
  } catch (error) {
    console.error("Erro ao executar queries:", error);
    console.error("Queries que falharam:");
    console.error("TopLinhas:", qTopLinhas);
    console.error("TopMaquinas:", qTopMaquinas);
    console.error("TipoMaquina:", qTipoMaquina);
    throw error;
  }
}
