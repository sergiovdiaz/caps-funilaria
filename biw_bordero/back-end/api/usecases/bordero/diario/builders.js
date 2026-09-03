// builder.js
export function buildMeta(view, line) {
  return {
    view,
    line,
    generated_at: new Date().toISOString(),
  };
}

export function buildProductionWindow(row, fallbackDate) {
  if (!row || !row.start_ts || !row.end_ts) {
    // fallback defensivo
    return {
      start_ts: `${fallbackDate} 00:00:00`,
      end_ts: `${fallbackDate} 23:59:59`,
    };
  }

  return {
    start_ts: row.start_ts,
    end_ts: row.end_ts,
  };
}

/* =======================
   SUMMARY (CARDS)
======================= */
export function buildDailySummary(rows) {
  const cards = {};

  rows.forEach((r) => {
    const key =
      r.turno === "Total"
        ? "total"
        : r.turno.replace("TURNO ", "").toLowerCase();

    cards[key] = {
      previsto: Number(r.previsto),
      realizado: Number(r.realizado),
      delta: Number(r.delta),
      jph: Number(r.jph),
      ope: Number(r.ope),
    };
  });

  return {
    date: rows[0]?.production_date ?? null,
    line: rows[0]?.line ?? null,
    cards,
  };
}

/* =======================
   HOURLY
======================= */
export function buildHourlyProduction(rows) {
  return rows.map((r) => ({
    ts_inicio: r.ts_inicio,
    ts_fim: r.ts_fim,
    hour: new Date(r.ts_inicio).getHours(),
    shift_number: r.shift_number,
    value: Number(r.value),
  }));
}

/* =======================
   EVENTS (BASE ÚNICA)
======================= */
export const buildEvents = (rows) => rows;
