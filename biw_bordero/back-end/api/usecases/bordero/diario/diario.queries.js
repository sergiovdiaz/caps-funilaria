// daily.queries.js
export const dailySummarySql = `
  SELECT
    line,
    production_date,
    turno,
    realizado,
    previsto,
    delta,
    jph,
    ope
  FROM get_daily_production_summary($1, $2);
`;

export const hourlyProductionSql = `
  SELECT
      ts_inicio,
      ts_fim,
      EXTRACT(HOUR FROM ts_inicio)::int AS hour,
      producao AS value,
      (RIGHT(turno, 1))::int AS shift_number  -- pega o último caractere e converte para inteiro
  FROM get_production_by_line_shift($1, NULL, $2)
  ORDER BY ts_inicio;

`;

export const statusHistorySql = `
  SELECT
    h.*,
    CASE
      WHEN h.element = '' OR h.element LIKE '%@%' THEN 'Estação'
      ELSE d.tipo_maquina
    END AS tipo_maquina
  FROM public.get_line_status_history2(
    $1,
    $2,
    $3,
    false
  ) h
  LEFT JOIN public.dim_tipo_maquina d
    ON h.element ~ ('[0-9]' || d.cod || '[0-9]');
`;

// daily.queries.js
export const productionDayWindowSql = `
  SELECT
    MIN(ts_inicio) AS start_ts,
    MAX(ts_fim)    AS end_ts
  FROM public.generate_production_schedule($1);
`;
