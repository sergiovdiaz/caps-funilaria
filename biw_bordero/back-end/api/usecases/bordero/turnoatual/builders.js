import { pool } from "../../../postgreConnect.js";

export function buildMeta(view, line) {
  return {
    view,
    line,
    generated_at: new Date().toISOString(),
  };
}

export async function buildDate() {
  const sql = `
    SELECT shift_date, shift_number
    FROM get_current_shift();
  `;

  try {
    const { rows } = await pool.query(sql);

    if (!rows.length) {
      return {
        timestamp: new Date().toISOString(),
        shift: null,
      };
    }

    const shift = rows[0];

    return {
      timestamp: new Date().toISOString(),
      shift: {
        date: shift.shift_date,
        number: shift.shift_number,
      },
    };
  } catch (err) {
    console.error("Erro ao buscar turno atual:", err);

    return {
      timestamp: new Date().toISOString(),
      shift: null,
    };
  }
}

export async function buildAndon(line) {
  try {
    /* =========================
       1. Turno atual
    ========================= */
    const shiftSql = `
      SELECT
        start_ts,
        production_target,
        duration_total
      FROM get_current_shift();
    `;

    const { rows: shiftRows } = await pool.query(shiftSql);

    if (!shiftRows.length) {
      return emptyAndon();
    }

    const { start_ts, production_target, duration_total } = shiftRows[0];

    /* =========================
       2. Teórica (linear)
    ========================= */
    const now = new Date();
    const start = new Date(start_ts);

    const elapsedHours = Math.max(0, (now - start) / (1000 * 60 * 60));

    const teorica = Math.min(
      production_target,
      (production_target / duration_total) * elapsedHours
    );

    /* =========================
       3. Realizado
    ========================= */
    const prodSql = `
      SELECT COUNT(*)::int AS realizado
      FROM production_raw
      WHERE
        "Line" = $1
        AND to_timestamp(_timestamp / 1000.0) >= $2;
    `;

    const { rows: prodRows } = await pool.query(prodSql, [line, start_ts]);

    const realizado = prodRows[0]?.realizado ?? 0;

    /* =========================
       4. Delta / Eficiência
    ========================= */
    const delta = realizado - teorica;
    const eficiencia = teorica > 0 ? realizado / teorica : 0;

    /* =========================
       5. Status / Alarme
    ========================= */
    const statusSql = `
      SELECT
        l.alarm,
        l.start_time,
        l.station,
        l.element,
        l.component,
        p.andondesc,
        p.color_hex
      FROM public.line_status_history l
      JOIN public.dim_priority p
        ON p.priority = l.priority
      WHERE l.line = $1
      ORDER BY l.id DESC
      LIMIT 1;
    `;

    const { rows: statusRows } = await pool.query(statusSql, [line]);
    const status = statusRows[0] || {};

    /* =========================
       6. Payload final
    ========================= */
    return {
      impostada: production_target,
      teorica: Math.round(teorica),
      realizado,
      delta: Math.round(delta),
      eficiencia: Number(eficiencia.toFixed(2)),

      status: status.andondesc ?? "Sem status",
      color_hex: status.color_hex ?? null,
      inicio: status.start_time ?? null,
      estacao: status.station ?? null,
      maquina: status.element ?? null,
      componente: status.component ?? null,
      alarm: status.alarm ?? null,
    };
  } catch (err) {
    console.error("Erro no buildAndon:", err);
    return emptyAndon();
  }
}

export async function buildBuffers({ upstream, downstream } = {}) {
  return {
    upstream: upstream
      ? {
          line: upstream.line,
          nome: upstream.nome,
          dados: upstream.dados ?? [],
        }
      : null,

    downstream: downstream
      ? {
          line: downstream.line,
          nome: downstream.nome,
          dados: downstream.dados ?? [],
        }
      : null,
  };
}

export async function buildHourly(line, date, turno) {
  const sql = `
    SELECT
      ts_inicio AS hour,
      producao AS value,
      hourly_target
    FROM get_production_by_line_shift($1, $2, $3)
    ORDER BY ts_inicio
  `;

  const normalizedDate = normalizeDate(date);

  try {
    const { rows } = await pool.query(sql, [
      line,
      turno || null,
      normalizedDate,
    ]);

    return {
      line,
      date: normalizedDate || "current",
      turno: turno || "todos",
      dados: rows,
    };
  } catch (err) {
    console.error("Erro buildHourly:", err);
    return {
      dados: [],
    };
  }
}

export async function buildGeneralLosses(line, startTs, endTs) {
  // SQL chamando a função PostgreSQL
  const sql = `
    SELECT *
    FROM public.get_losstime_by_priority($1, $2, $3)
  `;

  const startDate = new Date(startTs);
  const endDate = new Date(endTs);

  try {
    const { rows } = await pool.query(sql, [startDate, endDate, line]);

    return {
      dados: rows, // aqui já vai trazer label e seconds
    };
  } catch (err) {
    console.error("Erro buildGeneralLosses:", err);

    return {
      dados: [],
    };
  }
}

export async function buildTableLosses(line, startTs, endTs) {
  const sql = `
    SELECT *
    FROM public.get_line_status_history2($1, $2, $3, false)
  `;

  const startDate = new Date(startTs);
  const endDate = new Date(endTs);
  try {
    const { rows } = await pool.query(sql, [startDate, endDate, line]);

    return {
      dados: rows,
    };
  } catch (err) {
    console.error("Erro buildTableLosses:", err);

    return {
      dados: [],
    };
  }
}

// FUNÇÕES AUXILIARES
function emptyAndon() {
  return {
    impostada: 0,
    teorica: 0,
    realizado: 0,
    delta: 0,
    eficiencia: 0,
    status: "Sem status",
    inicio: null,
    estacao: null,
    maquina: null,
    componente: null,
    alarm: null,
  };
}

function normalizeDate(date) {
  if (!date) return null;

  if (date instanceof Date) {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  return date; // espera YYYY-MM-DD
}
