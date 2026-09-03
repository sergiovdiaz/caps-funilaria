//pcm.pgQueries.js

export const pgQueries = {
  // =============================
  // VERIFICAR SE EXISTEM DADOS
  // =============================
  existUpload: `
      SELECT 
      l.matricula,
      u.nome,
      l.uploaded_at
    FROM pcm.pcm_upload_log l
    LEFT JOIN auth.usuarios u 
      ON u.matricula = l.matricula
    WHERE l.ano = $1 
    AND l.semana = $2
    ORDER BY l.uploaded_at DESC
    LIMIT 1;
      `,

  // =============================
  // DELETE
  // =============================
  deleteDisponibilidadeByAnoSemana: `
      DELETE FROM pcm.pcm_disponibilidade
      WHERE ano = $1 AND semana = $2
    `,

  deleteAtividadesByAnoSemana: `
      DELETE FROM pcm.pcm_atividades
      WHERE ano = $1 AND semana = $2
    `,

  insertUploadLog: `
    INSERT INTO pcm.pcm_upload_log
    (ano, semana, matricula, uploaded_at, overwrite, nome_arquivo)
    VALUES ($1, $2, $3, NOW(), $4, $5)
  `,

  // =============================
  // GET PROGRAMAÇÃO POR COLABORADOR
  // =============================
  getProgramacaoPorColaborador: `
  WITH ultima_semana AS (
    SELECT ano, semana
    FROM pcm.pcm_atividades
    ORDER BY ano DESC, semana DESC
    LIMIT 1
  ),
  
  parametros AS (
    SELECT
      COALESCE($1::int, u.ano) AS ano,
      COALESCE($2::int, u.semana) AS semana
    FROM ultima_semana u
  ),
  
  atividades_semana AS (
    SELECT
      TRIM(
        split_part(nome_mdo, ' ', 1) || 
        CASE 
          WHEN split_part(nome_mdo, ' ', 2) <> '' 
          THEN ' ' || split_part(nome_mdo, ' ', 2)
          ELSE ''
        END
      ) AS nome_mdo,
      linha,
      maquina,
      grupo,
      atividade,
      inicio_ativ,
      fim_ativ
    FROM pcm.pcm_atividades p
    JOIN parametros par
      ON p.ano = par.ano AND p.semana = par.semana
  ),
  
  disponibilidade_semana AS (
    SELECT
      TRIM(
        split_part(nome, ' ', 1) || 
        CASE 
          WHEN split_part(nome, ' ', 2) <> '' 
          THEN ' ' || split_part(nome, ' ', 2)
          ELSE ''
        END
      ) AS nome_mdo,
      inicio_disp,
      fim_disp
    FROM pcm.pcm_disponibilidade d
    JOIN parametros par
      ON d.ano = par.ano AND d.semana = par.semana
  )
  
  SELECT
    n.nome_mdo AS label,
  
    (
      SELECT json_agg(jsonb_build_object(
        'start', a.inicio_ativ,
        'end', a.fim_ativ,
        'atividade', a.atividade,
        'linha', a.linha,
        'tecnologia', a.grupo,
        'maquina', a.maquina,
        'colaborador', a.nome_mdo
      ))
      FROM atividades_semana a
      WHERE a.nome_mdo = n.nome_mdo
    ) AS atividades,
  
    (
      SELECT json_agg(jsonb_build_object(
        'start', d.inicio_disp,
        'end', d.fim_disp
      ))
      FROM disponibilidade_semana d
      WHERE d.nome_mdo = n.nome_mdo
    ) AS disponibilidade
  
  FROM (
    SELECT nome_mdo FROM atividades_semana
    UNION
    SELECT nome_mdo FROM disponibilidade_semana
  ) n
  
  ORDER BY n.nome_mdo;
  `,
  // =============================
  // GET PROGRAMAÇÃO POR LINHA
  // =============================
  getProgramacaoPorLinha: `
  WITH ultima_semana AS (
    SELECT ano, semana
    FROM pcm.pcm_atividades
    ORDER BY ano DESC, semana DESC
    LIMIT 1
  ),
  
  parametros AS (
    SELECT
      COALESCE($1::int, u.ano) AS ano,
      COALESCE($2::int, u.semana) AS semana
    FROM ultima_semana u
  ),
  
  atividades_semana AS (
    SELECT 
      p.linha,
      p.grupo,
      p.maquina,
      p.atividade,
      p.inicio_ativ,
      p.fim_ativ,
      TRIM(
        split_part(p.nome_mdo, ' ', 1) || 
        CASE 
          WHEN split_part(p.nome_mdo, ' ', 2) <> '' 
          THEN ' ' || split_part(p.nome_mdo, ' ', 2)
          ELSE ''
        END
      ) AS nome_mdo
    FROM pcm.pcm_atividades p
    JOIN parametros par
      ON p.ano = par.ano 
     AND p.semana = par.semana
  ),
  
  atividades_agrupadas AS (
    SELECT
      linha,
      grupo,
      maquina,
      atividade,
      inicio_ativ,
      fim_ativ,
      json_agg(nome_mdo) AS colaboradores
    FROM atividades_semana
    GROUP BY 
      linha,
      grupo,
      maquina,
      atividade,
      inicio_ativ,
      fim_ativ
  )
  
  SELECT
    linha AS label,
    json_agg(
      jsonb_build_object(
        'start', inicio_ativ,
        'end', fim_ativ,
        'tecnologia',  grupo,
        'atividade', atividade,
        'maquina', maquina,
        'colaboradores', colaboradores
      )
    ) AS atividades
  FROM atividades_agrupadas
  GROUP BY linha
  ORDER BY linha;
  `,
  // =============================
  // RANGE DE DATAS DA SEMANA
  // =============================
  semanaRange: `
WITH ultima_semana AS (
  SELECT ano, semana
  FROM pcm.pcm_atividades
  ORDER BY ano DESC, semana DESC
  LIMIT 1
),

parametros AS (
  SELECT
    COALESCE($1::int, u.ano) AS ano,
    COALESCE($2::int, u.semana) AS semana
  FROM ultima_semana u
)

SELECT
  par.ano,
  par.semana,
  DATE_TRUNC('day', MIN(p.data)) AS "startDate",
  DATE_TRUNC('day', MAX(p.data)) + INTERVAL '23 hours 59 minutes 59 seconds' AS "endDate"
FROM pcm.pcm_atividades p
JOIN parametros par
  ON p.ano = par.ano AND p.semana = par.semana
GROUP BY par.ano, par.semana;
`,
};

export const TABLES = {
  DISPONIBILIDADE: "pcm.pcm_disponibilidade",
  ATIVIDADES: "pcm.pcm_atividades",
};
