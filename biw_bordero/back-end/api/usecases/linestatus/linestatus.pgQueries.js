//linestatus.pgQueries.js
export const pgQueries = {
  getLinestatusRules: `
    SELECT
      priority,
      andondesc, 
      color_hex
    FROM public.dim_priority;
    `,

  getLineST: `
    SELECT 
      linha,
      regexp_replace(maquina, '^[A-Z]{3,4}', 'ST') AS st
  FROM cap.dim_maquina
  WHERE tipologia = 'Estação'
  AND maquina NOT IN ('AUC134','AUC135','AUC136','AUC137')
  AND maquina !~ '(226|521|551)$';
  `,
};
