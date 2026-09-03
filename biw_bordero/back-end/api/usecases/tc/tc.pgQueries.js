export const tcHistoryQuery = {
  historyTc: `
      WITH base AS (
        SELECT
          r._timestamp,
          r.line,
          r.st,
          r.maq,
          r.tcdata,
          r.c_good,
          r.nseq,
          r.csald,
          l.tc_target AS target,
          l.is_simple_model,
          l.line AS line_code
        FROM tc.tc_raw r
        LEFT JOIN tc.dim_line l
          ON l.line = r.line
        WHERE r.line = $1
          AND r._timestamp BETWEEN $2 AND $3
          AND ($4::text IS NULL OR r.st = $4)
          AND ($5::text IS NULL OR r.maq = $5)
      ),
  
      modelo_corrigido AS (
        SELECT
          b.*,
          CASE 
            WHEN b.is_simple_model THEN dm.model_name
            ELSE b.line_code
          END AS model
        FROM base b
        LEFT JOIN tc.dim_model dm
          ON b.csald = dm.csald
      ),
  
      agg_st AS (
        -- agregação por ST
        SELECT
          st AS st_group,
          model,
          COUNT(*) AS totalCount,
          AVG(tcdata) AS average,
          ROUND(
            SUM(CASE WHEN tcdata > target THEN 1 ELSE 0 END)::decimal
            / COUNT(*) * 100,
            2
          ) AS outPercentage,
          AVG(CASE WHEN tcdata > target THEN tcdata END) AS outAverage
        FROM modelo_corrigido
        GROUP BY st, model
      ),
  
      agg_geral AS (
        -- agregação geral (todos os STs)
        SELECT
          'Geral' AS st_group,
          model,
          COUNT(*) AS totalCount,
          AVG(tcdata) AS average,
          ROUND(
            SUM(CASE WHEN tcdata > target THEN 1 ELSE 0 END)::decimal
            / COUNT(*) * 100,
            2
          ) AS outPercentage,
          AVG(CASE WHEN tcdata > target THEN tcdata END) AS outAverage
        FROM modelo_corrigido
        GROUP BY model
      )
  
      SELECT *
      FROM agg_geral
      UNION ALL
      SELECT *
      FROM agg_st
      ORDER BY st_group, model;
    `,
  historyDaily: `
    WITH base AS (
      SELECT
        r._timestamp,
        r.line,
        r.st,
        r.maq,
        r.tcdata,
        r.csald,
        l.tc_target AS target,
        l.is_simple_model,
        l.line AS line_code,
        DATE(r._timestamp) AS date,
        TO_CHAR(r._timestamp, 'IYYY-IW') AS week
      FROM tc.tc_raw r
      LEFT JOIN tc.dim_line l
        ON l.line = r.line
      WHERE r.line = $1
        AND r._timestamp BETWEEN $2 AND $3
        AND ($4::text IS NULL OR r.st = $4)
        AND ($5::text IS NULL OR r.maq = $5)
    ),

    modelo_corrigido AS (
      SELECT
        b.*,
        CASE 
          WHEN b.is_simple_model THEN dm.model_name
          ELSE dm.type_name
        END AS model
      FROM base b
      LEFT JOIN tc.dim_model dm
        ON b.csald = dm.csald
    )

    SELECT
    date,
    week,
    COALESCE(st, 'Geral') AS st,
    model,
    COUNT(*) AS "totalCount",
  
    ROUND(AVG(tcdata), 1) AS "average",
  
    ROUND(
      SUM(CASE WHEN tcdata > target THEN 1 ELSE 0 END)::decimal
      / COUNT(*) * 100,
      1
    ) AS "outPercentage",
  
    ROUND(
      AVG(CASE WHEN tcdata > target THEN tcdata END),
      1
    ) AS "outAverage"
  
  FROM modelo_corrigido
  WHERE model IS NOT NULL
  GROUP BY
    date,
    week,
    st,
    model
  ORDER BY
    date,
    st,
    model;
  
  `,
  targetTc: `SELECT
      line,
      tc_target
    FROM tc.dim_line
    WHERE line = $1;`,

  historyRaw: `
    SELECT
      r._timestamp,
      r.line,
      r.st,
      r.maq,
      r.tcdata,
      r.c_good,
      r.nseq,
      r.csald,
      r.id,

      l.tc_target AS target,
      l.is_simple_model,

      COALESCE(
        CASE 
          WHEN l.is_simple_model THEN dm.model_name
          ELSE dm.type_name
        END,
        r.csald::text
      ) AS model

    FROM tc.tc_raw r

    LEFT JOIN tc.dim_line l
      ON l.line = r.line

    LEFT JOIN tc.dim_model dm
      ON r.csald = dm.csald

    WHERE r.line = $1
      AND r._timestamp BETWEEN $2 AND $3
      AND ($4::text IS NULL OR r.st = $4)
      AND ($5::text IS NULL OR r.maq = $5)

    ORDER BY r._timestamp ASC;

  `,

  relatorioTC: `
    SELECT *
    FROM tc.vw_tc_24h_dashboard;
  `,
};
