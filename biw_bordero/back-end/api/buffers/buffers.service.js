// buffers.service.js
import { redisClient } from "../conectores/redis/redis_connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";
import { getCurrentShift } from "../shift/utils/shift.utils.js";

export async function registerBuffer({
  shop = "BiW",
  inLine,
  outLine,
  value = 1,
}) {
  const shift = getCurrentShift().Shift;
  if (!shift) return;

  // 🔹 Linha OUT (saída)
  const outKeys = shiftKeys({ shop, line: outLine, shift });

  await redisClient.hIncrBy(outKeys.buffer, `out:${inLine}`, value);

  // 🔹 Linha IN (entrada)
  const inKeys = shiftKeys({ shop, line: inLine, shift });

  await redisClient.hIncrBy(inKeys.buffer, `in:${outLine}`, value);
}
