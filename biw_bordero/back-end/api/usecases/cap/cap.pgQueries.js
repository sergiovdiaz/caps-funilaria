export const pgQueries = {
  getSccMaxJph: `
    SELECT
      line,
      tc_target,
      CASE
        WHEN tc_target > 0 THEN FLOOR(3600.0 / tc_target)
        ELSE NULL
      END AS jph_max
    FROM tc.dim_line
    WHERE line = 'SCC'
    LIMIT 1;
  `,

  getProducaoRaw: `
  SELECT *
  FROM cap.cap_get_prod_and_losses_cars($1, $2)
  ORDER BY ts_inicio, reasonDesc;
`,

  //   getJustificativaById: `
  //   SELECT
  //       h.*,
  //       u.nome AS criador_nome,
  //       u.area AS criador_area,
  //       d.responsavel,

  //       dj.idstatus,
  //       dj.validador,
  //       sj.status,
  //       sj.nome AS textstatus

  //   FROM cap.historico_justificativa h

  //   LEFT JOIN auth.usuarios u
  //       ON h.matricula = u.matricula

  //   LEFT JOIN cap.dim_responsavel_causaraiz d
  //       ON d.causa_raiz = h.causa_raiz

  //   LEFT JOIN cap.dim_justificativa dj
  //       ON dj.id = h.id_justificativa

  //   LEFT JOIN cap.dim_statusjustificativas sj
  //       ON sj.id = dj.idstatus

  //   WHERE h.id_justificativa = $1

  //   ORDER BY h.created_at DESC
  // `,
  // =============================
  // CRIAR JUSTIFICATIVA
  // =============================

  getJustificativaBase: `
  SELECT 
      h.id_justificativa,
      h.descricao,
      h.causa_raiz,
      h.maquina,
      h.componente,
      h.comentario,
      h.created_at,

      dj.linha,
      dj.data,
      dj.horaselecionada,
      dj.dur_min,
      dj.idstatus,
      dj.validador,
      dj.mantenedor_id,
      dj.mantenedor_nome_livre,

      sj.status,
      sj.nome AS textstatus,

      u.nome AS criador_nome,
      u.area AS criador_area,
      u.matricula,

      d.responsavel,
      
      -- Lógica do Interventor
      CASE 
          WHEN h.causa_raiz = 'FALHA EQUIPAMENTO' THEN
              COALESCE(
                  -- 1. Tenta buscar o nome formatado do mantenedor vinculado
                  (
                      SELECT CONCAT(
                          split_part(u2.nome, ' ', 1), 
                          ' ', 
                          split_part(u2.nome, ' ', array_length(string_to_array(u2.nome, ' '), 1)), 
                          ' - ', 
                          m.tecnologia
                      ) 
                      FROM cap.dim_mantenedor m 
                      LEFT JOIN auth.usuarios u2 ON m.matricula = u2.matricula 
                      WHERE m.id = dj.mantenedor_id 
                          AND m.ativo = true
                          AND dj.mantenedor_id IS NOT NULL
                  ),
                  
                  -- 2. Se nulo, tenta o nome livre (ignorando strings vazias)
                  NULLIF(TRIM(dj.mantenedor_nome_livre), ''),
                  
                  -- 3. Se ainda nulo, traz o nome do criador
                  CONCAT(
                    split_part(u.nome, ' ', 1),
                    ' ',
                    split_part(u.nome, ' ', array_length(string_to_array(u.nome, ' '), 1))
                )
              )
          ELSE NULL 
      END AS interventor

  FROM cap.historico_justificativa h
  LEFT JOIN cap.dim_justificativa dj ON dj.id = h.id_justificativa
  LEFT JOIN cap.dim_statusjustificativas sj ON sj.id = dj.idstatus
  LEFT JOIN auth.usuarios u ON u.matricula = h.matricula
  LEFT JOIN cap.dim_responsavel_causaraiz d ON d.causa_raiz = h.causa_raiz

  WHERE h.id_justificativa = $1
  ORDER BY h.created_at DESC
`,

  getJustificativaById: `
  SELECT 
    h.*,
    u.nome AS criador_nome,
    u.area AS criador_area,
    d.responsavel,
    dj.idstatus,
    dj.validador,
    sj.status,
    sj.nome AS textstatus,
    
    -- Lógica do Interventor
    CASE 
        WHEN h.causa_raiz = 'FALHA EQUIPAMENTO' THEN
            COALESCE(
                -- 1. Tenta buscar o nome formatado do mantenedor vinculado
                (SELECT CONCAT(
                    split_part(u2.nome, ' ', 1), 
                    ' ', 
                    split_part(u2.nome, ' ', array_length(string_to_array(u2.nome, ' '), 1)), 
                    ' - ', 
                    m.tecnologia
                ) 
                FROM cap.dim_mantenedor m 
                LEFT JOIN auth.usuarios u2 ON m.matricula = u2.matricula 
                WHERE m.id = dj.mantenedor_id AND m.ativo = true),
                
                -- 2. Se nulo, tenta o nome livre
                dj.mantenedor_nome_livre,
                
                -- 3. Se ainda nulo, traz o nome do criador
                u.nome
            )
        ELSE NULL 
    END AS interventor

  FROM cap.historico_justificativa h

  LEFT JOIN auth.usuarios u 
    ON h.matricula = u.matricula

  LEFT JOIN cap.dim_responsavel_causaraiz d
    ON d.causa_raiz = h.causa_raiz

  LEFT JOIN cap.dim_justificativa dj
    ON dj.id = h.id_justificativa

  LEFT JOIN cap.dim_statusjustificativas sj
    ON sj.id = dj.idstatus

  WHERE h.id_justificativa = $1

  ORDER BY h.created_at DESC
  `,
  getCadeiaRelacionamentos: `
  WITH RECURSIVE precedentes AS (
    SELECT 
        jr.justificativa_id AS pai_id,
        jr.justificativa_relacionada_id AS id_justificativa,
        jr.tempo_alocado,
        jr.created_at,
        1 AS nivel,
        'UP' AS direcao,
        ARRAY[jr.justificativa_id, jr.justificativa_relacionada_id] AS caminho
    FROM cap.rel_justificativa_alocacao_tempo jr
    WHERE jr.justificativa_id = $1

    UNION ALL

    SELECT 
        jr.justificativa_id,
        jr.justificativa_relacionada_id,
        jr.tempo_alocado,
        jr.created_at,
        p.nivel + 1,
        'UP',
        p.caminho || jr.justificativa_relacionada_id
    FROM cap.rel_justificativa_alocacao_tempo jr
    JOIN precedentes p 
        ON jr.justificativa_id = p.id_justificativa
    WHERE NOT (jr.justificativa_relacionada_id = ANY(p.caminho))
),

sucessivos AS (
    SELECT 
        jr.justificativa_relacionada_id AS pai_id,
        jr.justificativa_id AS id_justificativa,
        jr.tempo_alocado,
        jr.created_at,
        1 AS nivel,
        'DOWN' AS direcao,
        ARRAY[jr.justificativa_relacionada_id, jr.justificativa_id] AS caminho
    FROM cap.rel_justificativa_alocacao_tempo jr
    WHERE jr.justificativa_relacionada_id = $1

    UNION ALL

    SELECT 
        jr.justificativa_relacionada_id,
        jr.justificativa_id,
        jr.tempo_alocado,
        jr.created_at,
        s.nivel + 1,
        'DOWN',
        s.caminho || jr.justificativa_id
    FROM cap.rel_justificativa_alocacao_tempo jr
    JOIN sucessivos s 
        ON jr.justificativa_relacionada_id = s.id_justificativa
    WHERE NOT (jr.justificativa_id = ANY(s.caminho))
),

todas_relacoes AS (
    SELECT * FROM precedentes
    UNION ALL
    SELECT * FROM sucessivos
)

SELECT DISTINCT ON (tr.id_justificativa)
    tr.pai_id,
    tr.id_justificativa,
    tr.tempo_alocado,
    tr.created_at AS relacao_created_at,
    tr.nivel,
    tr.direcao,

    --  DADOS QUE VOCÊ QUER
    h.causa_raiz,
    h.descricao,
    h.componente,
    h.maquina,
    dj.linha,
    dj.dur_min,
    
    u.nome AS criador_nome,
    u.area AS criador_area,
    d.responsavel,

    dj.idstatus,
    dj.validador,
    sj.status,
    sj.nome AS textstatus,

    CASE 
        WHEN h.causa_raiz = 'FALHA EQUIPAMENTO' THEN
            COALESCE(
                (
                    SELECT CONCAT(
                        split_part(u2.nome, ' ', 1), 
                        ' ', 
                        split_part(u2.nome, ' ', array_length(string_to_array(u2.nome, ' '), 1)), 
                        ' - ', 
                        m.tecnologia
                    ) 
                    FROM cap.dim_mantenedor m 
                    LEFT JOIN auth.usuarios u2 ON m.matricula = u2.matricula 
                    WHERE m.id = dj.mantenedor_id AND m.ativo = true
                ),
                dj.mantenedor_nome_livre,
                u.nome
            )
        ELSE NULL 
    END AS interventor

FROM todas_relacoes tr

LEFT JOIN cap.historico_justificativa h 
    ON h.id_justificativa = tr.id_justificativa

LEFT JOIN cap.dim_justificativa dj 
    ON dj.id = tr.id_justificativa

LEFT JOIN auth.usuarios u 
    ON h.matricula = u.matricula

LEFT JOIN cap.dim_responsavel_causaraiz d
    ON d.causa_raiz = h.causa_raiz

LEFT JOIN cap.dim_statusjustificativas sj
    ON sj.id = dj.idstatus

ORDER BY 
    tr.id_justificativa,
    tr.nivel ASC,
    tr.created_at DESC
 `,

  getJustificativasRelacionadas: `
  SELECT 
    jr.justificativa_relacionada_id,
    jr.tempo_alocado,
    jr.created_at AS relacao_created_at
  FROM cap.rel_justificativa_alocacao_tempo jr
  WHERE jr.justificativa_id = $1
  ORDER BY jr.created_at DESC
`,

  insertJustificativa: `
  INSERT INTO cap.dim_justificativa
  (
    data,
    horaselecionada,
    linha,
    matricula_criador,
    idstatus,
    causa_raiz,
    validador,
    dur_min,
    descricao,
    ts_inicio,
    componente,
    maquina,
    mantenedor_id,
    usuario_id,
    mantenedor_nome_livre
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamp + split_part($2, ' - ', 1)::time, $11, $12, $13, $14, $15)
  RETURNING id;
`,

  getResponsavelByCausaRaiz: `
  SELECT responsavel
  FROM cap.dim_responsavel_causaraiz
  WHERE causa_raiz = $1
  LIMIT 1;
`,

  // =============================
  // HISTÓRICO
  // =============================
  // Insert no histórico
  insertHistorico: `
    INSERT INTO cap.historico_justificativa
    (
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
      manutentor_id,
      usuario_id,
      manutentor_nome_livre,
      created_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
    );
  `,

  // =============================
  // ALARMES (caso queira usar individual)
  // =============================
  insertAlarme: `
  INSERT INTO cap.dim_alarmesjustificados
  (
    id_justificativa,
    alarmsid,
    data,
    horaselecionada
  )
  VALUES ($1, $2, $3, $4);
`,

  getJustificativaStatus: `
    SELECT 
      j.id,
      j.idstatus,
      j.validador,
      d.responsavel
    FROM cap.dim_justificativa j
    LEFT JOIN cap.dim_responsavel_causaraiz d
      ON j.causa_raiz = d.causa_raiz
    WHERE j.id = $1
`,

  // =============================
  // PENDÊNCIAS
  // =============================
  listarPendenciasBase: `
  SELECT
    line,
    ute,
    turno,
    ts_inicio,
    justificado
  FROM cap.mv_justificado_ultimos_2_dias
`,

  getCapHistoricoJustificativas: `
    SELECT 
      j.*,
      j.turno as turno2,

      CASE 
          WHEN EXTRACT(HOUR FROM j.ts_inicio) BETWEEN 6 AND 15 THEN 1
          WHEN EXTRACT(HOUR FROM j.ts_inicio) BETWEEN 1 AND 5 THEN 3
          ELSE 2
      END AS turno

    FROM cap.vw_justificativas_detalhadas_v3 j

    LEFT JOIN tc.dim_line l
      ON j.linha = l.line

    WHERE j.ts_inicio::date >= $1
      AND j.ts_inicio::date <= $2
      AND j.causa_raiz NOT IN ('FALTA ABSORÇÃO', 'FALTA ALIMENTAÇÃO')

    ORDER BY j.carros DESC;
  `,

  getDisponivelAlocacao: `
  
    WITH deps AS (
      SELECT upstream_line, downstream_line
      FROM biw.line_dependencies
    ),
    
    related_lines AS (
      --  FALTA ALIMENTAÇÃO → pega upstream
      SELECT d.upstream_line AS linha
      FROM deps d
      WHERE d.downstream_line = $1
        AND $2 = 'FALTA_ALIMENTACAO'
    
      UNION
    
      --  FALTA ABSORÇÃO → pega downstream
      SELECT d.downstream_line AS linha
      FROM deps d
      WHERE d.upstream_line = $1
        AND $2 = 'FALTA_ABSORCAO'
    ),
    
    justificativas AS (
      SELECT *
      FROM cap.dim_justificativa j
      WHERE j.linha IN (SELECT linha FROM related_lines)
    
        -- ⏱️ janela baseada no ts_inicio (com ajuste -3h)
        AND j.ts_inicio >= $3::timestamp - (($4 + 3) || ' hours')::INTERVAL
        AND j.ts_inicio <= $3::timestamp - (3|| ' hours')::INTERVAL
    
        AND (
          -- 🔼 FALTA ALIMENTAÇÃO → NÃO traz FALTA ABSORÇÃO
          ($2 = 'FALTA_ALIMENTACAO' AND j.causa_raiz <> 'FALTA ABSORÇÃO') 
        
          OR
        
          -- 🔽 FALTA ABSORÇÃO → pode trazer tudo,
          -- EXCETO FALTA ALIMENTAÇÃO já alocada com a linha atual
          ($2 = 'FALTA_ABSORCAO' AND NOT EXISTS (
            SELECT 1
            FROM cap.rel_justificativa_alocacao_tempo r
            JOIN cap.dim_justificativa j2 
              ON j2.id = r.justificativa_relacionada_id
            WHERE r.justificativa_id = j.id
              AND j.causa_raiz = 'FALTA ALIMENTAÇÃO'
              AND j2.linha = $1
          ))
        )
    ),
    
    alocacoes AS (
      SELECT
        justificativa_relacionada_id,
        SUM(tempo_alocado) AS tempo_alocado
      FROM cap.rel_justificativa_alocacao_tempo
      GROUP BY justificativa_relacionada_id
    )
    
    SELECT
      j.id,
      j.data,
      j.horaselecionada AS hora,
      j.linha,
      j.causa_raiz,
      j.dur_min,
    
      -- 🧠 fallback máquina do histórico
      COALESCE(j.maquina, h_last.maquina) AS maquina,
    
      j.ts_inicio,
      j.idstatus,
      s.status,
      s.nome AS status_nome,
    
      j.descricao AS modo_falha,
      j.componente,
    
      COALESCE(a.tempo_alocado, 0) AS tempo_alocado,
      (j.dur_min - COALESCE(a.tempo_alocado, 0)) AS tempo_disponivel
    
    FROM justificativas j
    
    -- 🔎 pega última máquina do histórico
    LEFT JOIN LATERAL (
      SELECT h.maquina
      FROM cap.historico_justificativa h
      WHERE h.id_justificativa = j.id
      ORDER BY h.created_at DESC
      LIMIT 1
    ) h_last ON true
    
    LEFT JOIN alocacoes a
      ON a.justificativa_relacionada_id = j.id
    
    LEFT JOIN cap.dim_statusjustificativas s
      ON s.id = j.idstatus
    
    ORDER BY j.ts_inicio DESC;
  `,
};

export function buildListarJustificativasQuery(filtros = {}) {
  const qb = createQueryBuilder(`
    SELECT 
      h.*,
      r.responsavel,
      s.status as textstatus,
      s.nome AS status,
      j.validador,
      j.ts_inicio,
      sched.turno
    FROM cap.historico_justificativa h
    LEFT JOIN cap.dim_justificativa j
        ON h.id_justificativa = j.id
    LEFT JOIN cap.dim_responsavel_causaraiz r
        ON j.causa_raiz = r.causa_raiz
    LEFT JOIN cap.dim_statusjustificativas s
        ON j.idstatus = s.id
    INNER JOIN (
        SELECT id_justificativa, MAX(created_at) AS max_created
        FROM cap.historico_justificativa
        GROUP BY id_justificativa
    ) last_hist
        ON h.id_justificativa = last_hist.id_justificativa
        AND h.created_at = last_hist.max_created
    CROSS JOIN LATERAL generate_production_schedule(j.data::date) sched(intervalo, turno, ts_inicio, ts_fim, hourly_target)
    WHERE j.ts_inicio = sched.ts_inicio
  `);

  qb.addCondition("h.linha", filtros.linha);
  qb.addCondition("DATE(j.data)", filtros.dataSelecionada);
  qb.addCondition("j.horaselecionada", filtros.horaSelecionada);
  qb.addCondition("j.causa_raiz", filtros.causaRaiz);

  qb.addLike("h.matricula", filtros.matricula);

  qb.addCondition(
    "TRIM(BOTH FROM split_part(h.maquina, '-'::text, 1))",
    filtros.maquina,
  );

  //  exemplo de range
  qb.addRange("j.data", filtros.dataInicio, filtros.dataFim);

  //  paginação
  qb.paginate(filtros.limit, filtros.offset);

  return qb.build("j.data DESC, j.ts_inicio ASC");
}

export function buildListarMaquinasQuery(filtros = {}) {
  const qb = createQueryBuilder(`
    SELECT 
        m_maquina,
        linha,
        maquina || ' - ' || tipologia AS maquina
    FROM cap.dim_maquina
  `);

  qb.addCondition("linha", filtros.linha);
  qb.addLike("maquina", filtros.maquina);

  return qb.build("linha, maquina");
}

export function createQueryBuilder(baseQuery) {
  const values = [];
  const conditions = [];
  let limitClause = "";
  let offsetClause = "";

  const addCondition = (field, value, operator = "=") => {
    if (value === undefined || value === null || value === "") return;

    values.push(value);
    conditions.push(`${field} ${operator} $${values.length}`);
  };

  const addLike = (field, value) => {
    if (!value) return;

    values.push(`%${value}%`);
    conditions.push(`${field} ILIKE $${values.length}`);
  };

  const addIn = (field, array = []) => {
    if (!Array.isArray(array) || array.length === 0) return;

    const placeholders = array.map((_, i) => `$${values.length + i + 1}`);
    values.push(...array);

    conditions.push(`${field} IN (${placeholders.join(", ")})`);
  };

  const addRange = (field, start, end) => {
    if (start) {
      values.push(start);
      conditions.push(`${field} >= $${values.length}`);
    }

    if (end) {
      values.push(end);
      conditions.push(`${field} <= $${values.length}`);
    }
  };

  const paginate = (limit, offset) => {
    if (limit) {
      values.push(limit);
      limitClause = ` LIMIT $${values.length}`;
    }

    if (offset) {
      values.push(offset);
      offsetClause = ` OFFSET $${values.length}`;
    }
  };

  const build = (orderBy = "") => {
    let query = baseQuery;

    if (conditions.length > 0) {
      if (query.toLowerCase().includes("where")) {
        query += " AND " + conditions.join(" AND ");
      } else {
        query += " WHERE " + conditions.join(" AND ");
      }
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    query += limitClause + offsetClause;

    return { query, values };
  };

  return {
    addCondition,
    addLike,
    addIn,
    addRange,
    paginate,
    build,
  };
}

export function buildListarPendenciasQuery(filtros = {}) {
  const qb = createQueryBuilder(pgQueries.listarPendenciasBase);

  qb.addCondition("line", filtros.line);
  qb.addCondition("ute", filtros.ute);
  qb.addCondition("turno", filtros.turno);

  // data
  qb.addCondition("DATE(ts_inicio)", filtros.dataSelecionada);

  // boolean
  if (typeof filtros.justificado === "boolean") {
    qb.addCondition("justificado", filtros.justificado);
  }

  return qb.build("ts_inicio DESC, line ASC");
}
