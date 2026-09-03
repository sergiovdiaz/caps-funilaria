// produstion.service.js

import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";

const AGGREGATION_INTERVAL = 5; // minutos
const DATA_WINDOW = 60; // última 1 hora

function roundToBucket(date) {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const roundedMinutes =
    Math.floor(minutes / AGGREGATION_INTERVAL) * AGGREGATION_INTERVAL;
  d.setMinutes(roundedMinutes, 0, 0);
  return d.toISOString();
}

export async function registerProduction(ctx) {
  const { meta, keys } = ctx;
  const bucketTs = roundToBucket(meta.ts);
  const bucketKey = `${keys.productionBucketBase}|${bucketTs}`;
  // console.log(
  //   `[PRODUCTION] Registering production data for bucket: ${bucketKey}`,
  // );

  const now = Date.now();

  //0️⃣ limpa buckets antigos do index (sliding window)
  await redisClient.zRemRangeByScore(
    keys.productionIndex,
    0,
    now - DATA_WINDOW * 60 * 1000,
  );

  // 1️⃣ contador acumulado do turno
  const shiftCount = await redisClient.hIncrBy(
    keys.productionShift,
    "count",
    1,
  );
  // console.log(
  //   `Contador acumulado do turno (${keys.productionShift}):`,
  //   shiftCount,
  // );

  // 2️⃣ contador do bucket temporal
  const bucketCount = await redisClient.hIncrBy(bucketKey, "count", 1);

  // indexa o bucket
  await redisClient.zAdd(keys.productionIndex, {
    score: new Date(bucketTs).getTime(),
    value: bucketKey,
  });

  // TTL do bucket (auto limpeza)
  await redisClient.expire(bucketKey, DATA_WINDOW * 60);

  // console.log("[REDIS]");
  // console.log("Shift key:", keys.productionShift, "→", shiftCount);
  // console.log("Bucket key:", bucketKey, "→", bucketCount);
}
