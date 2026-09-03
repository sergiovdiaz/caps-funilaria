import { pool } from "../../postgreConnect.js";
import { tcHistoryQuery } from "./tc.pgQueries.js";

export async function getHistoryTC({
  line,
  startDate,
  endDate,
  st = null,
  maq = null,
}) {
  console.log("getHistoryTC called with:", {
    line,
    startDate,
    endDate,
    st,
    maq,
  });

  const client = await pool.connect();

  try {
    const [historyRes, targetRes] = await Promise.all([
      client.query(tcHistoryQuery.historyDaily, [
        line,
        startDate,
        endDate,
        st,
        maq,
      ]),
      client.query(tcHistoryQuery.targetTc, [line]),
    ]);

    return {
      target: targetRes.rows[0]?.tc_target ?? null,
      history: historyRes.rows,
    };
  } finally {
    client.release();
  }
}

export const getHistoryTCRaw = async ({
  line,
  startDate,
  endDate,
  st,
  maq,
}) => {
  const values = [line, startDate, endDate, st, maq];

  const { rows } = await pool.query(tcHistoryQuery.historyRaw, values);

  const stations = {};
  const timestampsSet = new Set();

  for (const row of rows) {
    // timeline global
    timestampsSet.add(row._timestamp);

    // agrupar por ST
    if (!stations[row.st]) {
      stations[row.st] = [];
    }

    stations[row.st].push({
      _timestamp: row._timestamp,
      tcdata: row.tcdata,
      model: row.model,
      target: row.target,
      maq: row.maq,
      id: row.id,
    });
  }

  const timestamps = Array.from(timestampsSet).sort(
    (a, b) => new Date(a) - new Date(b),
  );

  return {
    timestamps,
    stations,
  };
};

export const getTCRelatorio = async () => {
  const { rows } = await pool.query(tcHistoryQuery.relatorioTC);

  return rows;
};