// daily.builder.js
import {
  dailySummarySql,
  hourlyProductionSql,
  statusHistorySql,
  productionDayWindowSql,
} from "./diario.queries.js";

import {
  buildMeta,
  buildDailySummary,
  buildHourlyProduction,
  buildEvents,
  buildProductionWindow,
} from "./builders.js";
import { pool } from "../../../postgreConnect.js";
export async function buildBorderoDiario(line, date) {
  try {
    /* ======================
       1. JANELA DE PRODUÇÃO DO DIA
    ====================== */
    const { rows: windowRows } = await pool.query(productionDayWindowSql, [
      date,
    ]);

    const window = buildProductionWindow(windowRows[0], date);

    /* ======================
       2. QUERIES PRINCIPAIS
    ====================== */
    const [summaryRes, hourlyRes, historyRes] = await Promise.all([
      pool.query(dailySummarySql, [line, date]),
      pool.query(hourlyProductionSql, [line, date]),
      pool.query(statusHistorySql, [window.start_ts, window.end_ts, line]),
    ]);

    /* ======================
       3. BUILDERS
    ====================== */
    const summary = buildDailySummary(summaryRes.rows);
    const hourlyProduction = buildHourlyProduction(hourlyRes.rows);
    const events = buildEvents(historyRes.rows);

    /* ======================
       4. PAYLOAD FINAL
    ====================== */
    return {
      meta: {
        ...buildMeta("daily_dashboard", line),
        start_ts: window.start_ts,
        end_ts: window.end_ts,
      },
      summary,
      hourly_production: hourlyProduction,
      events,
    };
  } catch (err) {
    console.error("Erro buildDailyDashboard:", err);
    return {
      meta: buildMeta("daily_dashboard", line),
      summary: null,
      hourly_production: [],
      events: [],
    };
  }
}
