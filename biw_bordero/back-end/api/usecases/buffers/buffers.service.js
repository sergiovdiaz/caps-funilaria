// buffers.service.js
import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";
import { getCurrentShift } from "../shift/utils/shift.utils.js";

export async function registerBuffer({
  shop = "BiW",
  inLine,
  outLine,
  value = 0,
}) {
  const shift = getCurrentShift()?.Shift;
  if (!shift) return;

  const numericValue = Number(value) || 0;

  // 🔹 Linha OUT (saída)
  const outKeys = shiftKeys({ shop, line: outLine, shift });

  await redisClient.hSet(outKeys.buffer, `out:${inLine}`, numericValue);

  // 🔹 Linha IN (entrada)
  const inKeys = shiftKeys({ shop, line: inLine, shift });

  await redisClient.hSet(inKeys.buffer, `in:${outLine}`, numericValue);
}
