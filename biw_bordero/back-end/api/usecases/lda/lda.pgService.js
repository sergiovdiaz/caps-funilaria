import { pool } from "../../postgreConnect.js";

export async function getEventosLDA() {
  const query = `
  SELECT *
  FROM public.vw_lda_eventos
  WHERE created_at >= NOW() - INTERVAL '3 month'
  ORDER BY id DESC
  `;
  const { rows } = await pool.query(query);

  return rows;
}

export async function getKpiLDADashboard({ inicio, fim, turno = null }) {
  // Condição para filtrar por turno
  const turnoFilter =
    turno && turno !== "TODOS" ? `AND turno = '${turno}'` : "";

  const query = `
    WITH base AS (
      SELECT 
        cis,
        evento,
        created_at,
        DATE(created_at) AS data,
        CASE 
          WHEN EXTRACT(HOUR FROM created_at) >= 6 AND EXTRACT(HOUR FROM created_at) < 16 THEN 'T1'
          WHEN EXTRACT(HOUR FROM created_at) >= 1 AND EXTRACT(HOUR FROM created_at) < 6  THEN 'T3'
          ELSE 'T2'
        END AS turno
      FROM public.lda_eventos
      WHERE created_at::date BETWEEN $1 AND $2
      ${turnoFilter}
    ),

    hoje AS (
      SELECT *
      FROM base
      WHERE data = CURRENT_DATE
    ),

    ultimo_periodo AS (
      SELECT DISTINCT ON (cis)
        cis,
        evento
      FROM base
      ORDER BY cis, created_at DESC
    ),

    ultimo_hoje AS (
      SELECT DISTINCT ON (cis)
        cis,
        evento
      FROM hoje
      ORDER BY cis, created_at DESC
    ),

    kpi_periodo AS (
      SELECT
        COUNT(*) FILTER (WHERE evento = 0) AS extracoes,
        COUNT(*) FILTER (WHERE evento = 1) AS insercoes,
        COUNT(DISTINCT cis) AS cis_total
      FROM base
    ),

    kpi_hoje AS (
      SELECT
        COUNT(*) FILTER (WHERE evento = 0) AS extracoes,
        COUNT(*) FILTER (WHERE evento = 1) AS insercoes
      FROM hoje
    ),

    fora_periodo AS (
      SELECT COUNT(*) AS fora
      FROM ultimo_periodo
      WHERE evento = 0
    ),

    fora_hoje AS (
      SELECT COUNT(*) AS fora
      FROM ultimo_hoje
      WHERE evento = 0
    )

    SELECT
      json_build_object(
        'hoje', json_build_object(
          'extracoes', COALESCE(kph.extracoes, 0),
          'insercoes', COALESCE(kph.insercoes, 0),
          'fora', COALESCE(fh.fora, 0),
          'taxaRetorno', CASE 
            WHEN COALESCE(kph.extracoes, 0) = 0 THEN 100
            ELSE ROUND((COALESCE(kph.insercoes, 0)::decimal / COALESCE(kph.extracoes, 1)) * 100)
          END
        ),

        'periodo', json_build_object(
          'extracoes', COALESCE(kp.extracoes, 0),
          'insercoes', COALESCE(kp.insercoes, 0),
          'cisTotal', COALESCE(kp.cis_total, 0),
          'fora', COALESCE(fp.fora, 0),
          'taxaRetorno', CASE 
            WHEN COALESCE(kp.extracoes, 0) = 0 THEN 100
            ELSE ROUND((COALESCE(kp.insercoes, 0)::decimal / COALESCE(kp.extracoes, 1)) * 100)
          END
        )
      ) AS kpis
    FROM kpi_periodo kp
    CROSS JOIN kpi_hoje kph
    CROSS JOIN fora_periodo fp
    CROSS JOIN fora_hoje fh;
  `;

  const params = [inicio, fim];
  const { rows } = await pool.query(query, params);

  return (
    rows[0]?.kpis || {
      hoje: { extracoes: 0, insercoes: 0, fora: 0, taxaRetorno: 100 },
      periodo: {
        extracoes: 0,
        insercoes: 0,
        cisTotal: 0,
        fora: 0,
        taxaRetorno: 100,
      },
    }
  );
}
