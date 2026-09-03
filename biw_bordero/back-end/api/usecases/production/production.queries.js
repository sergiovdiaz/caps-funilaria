//production.queries.js
import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";
import { getCurrentShift } from "../shift/utils/shift.utils.js";

const AGGREGATION_INTERVAL = 5;
const DATA_WINDOW = 60; // última 1 hora

function roundToBucket(date) {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const roundedMinutes =
    Math.floor(minutes / AGGREGATION_INTERVAL) * AGGREGATION_INTERVAL;
  d.setMinutes(roundedMinutes, 0, 0);
  return d.toISOString();
}

export async function getProductionSeries({ shop = "BiW", line, shift } = {}) {
  if (!line) {
    return {
      meta: null,
      series: [],
    };
  }

  // se não veio shift, resolve automaticamente
  const effectiveShift = shift ?? getCurrentShift().Shift;
  if (!effectiveShift) {
    return {
      meta: null,
      series: [],
    };
  }

  const { productionIndex } = shiftKeys({
    shop,
    line,
    shift: effectiveShift,
  });

  const now = Date.now();
  const windowStart = now - DATA_WINDOW * 60 * 1000;

  // busca buckets no período
  const buckets = await redisClient.zRangeByScore(
    productionIndex,
    windowStart,
    now,
  );

  // gera timestamps esperados (garante continuidade no gráfico)
  const expectedTimestamps = [];
  let cursor = new Date(windowStart);

  while (cursor.getTime() <= now) {
    expectedTimestamps.push(roundToBucket(cursor));
    cursor = new Date(cursor.getTime() + AGGREGATION_INTERVAL * 60 * 1000);
  }

  // inicializa série com zero
  const seriesMap = {};
  for (const ts of expectedTimestamps) {
    seriesMap[ts] = 0;
  }

  // preenche com valores reais
  for (const bucketKey of buckets) {
    const count = await redisClient.hGet(bucketKey, "count");
    if (count === null) continue;

    const ts = bucketKey.split("|").at(-1);
    if (ts in seriesMap) {
      seriesMap[ts] = Number(count);
    }
  }

  return {
    meta: {
      shop,
      line,
      shift: effectiveShift,
      windowMinutes: DATA_WINDOW,
      aggregationMinutes: AGGREGATION_INTERVAL,
      generatedAt: new Date(now).toISOString(),
    },
    series: [
      {
        name: "production",
        unit: "cars",
        data: expectedTimestamps.map((ts) => ({
          ts,
          value: seriesMap[ts],
        })),
      },
    ],
  };
}
