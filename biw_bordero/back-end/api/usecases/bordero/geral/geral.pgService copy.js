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

  if (filters.tipo_maquina) {
    conditions.push(`tipo_maquina = $${i++}`);
    params.push(filters.tipo_maquina);
  }

  const where = conditions.length ? " AND " + conditions.join(" AND ") : "";

  return { where, params };
}

// =============================
// DASHBOARD
// =============================
export async function getDashboard(filters) {
  const { where, params } = buildWhere(filters);

  // =============================
  // TOP LINHAS
  // =============================
  const qTopLinhas = `
    SELECT *
    FROM (
      SELECT
        line,
        SUM(CASE WHEN reasondesc = 'Microparadas' THEN losstime ELSE 0 END)/60 AS micro,
        SUM(CASE WHEN reasondesc = 'Quebras' THEN losstime ELSE 0 END)/60 AS quebra
      ${pgQueries.base}
      ${where}
      GROUP BY line
    ) t
    ORDER BY (micro + quebra) DESC
    LIMIT 10;
  `;

  // =============================
  // TOP MAQUINAS
  // =============================
  const qTopMaquinas = `
    SELECT
      maquina,
      SUM(losstime)/60 AS loss_min
    ${pgQueries.base}
    ${where}
    GROUP BY maquina
    ORDER BY loss_min DESC
    LIMIT 15;
  `;

  // =============================
  // TIPO MAQUINA
  // =============================
  const qTipoMaquina = `
    SELECT
    CASE 
        WHEN tipo_maquina IS NULL OR tipo_maquina = '' THEN 'Não Identificado'
        ELSE tipo_maquina
    END AS tipo_maquina,
    SUM(losstime)/60 AS loss_min
    ${pgQueries.base}
    ${where}
    GROUP BY tipo_maquina
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
      ${where}
      ${where ? "AND" : "AND"} DATE_TRUNC('week', date) = $${params.length + 1}
      GROUP BY date
      ORDER BY date;
    `;
    tendenciaParams.push(filters.semana);
  } else {
    qTendencia = `
      SELECT
        DATE_TRUNC('week', date) AS periodo,
        SUM(losstime)/60 AS loss_min
      ${pgQueries.base}
      ${where}
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
    station,
    element,
    component,
    event_id,
    alarm,
    maquina,
    COUNT(*) AS ocorrencias,
    SUM(losstime)/60 AS loss_min
  ${pgQueries.base}
  ${where}
  GROUP BY line, station, element, component, event_id, alarm, maquina
  ORDER BY loss_min DESC
  LIMIT 100;
`;
  // =============================
  // EXECUÇÃO
  // =============================
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
}
