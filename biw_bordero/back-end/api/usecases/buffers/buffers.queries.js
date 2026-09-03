import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";
import { getCurrentShift } from "../shift/utils/shift.utils.js";

export async function getBufferStatus({ shop = "BiW", line }) {
  const shift = getCurrentShift()?.Shift;
  if (!shift) return null;

  const { buffer } = shiftKeys({ shop, line, shift });

  const data = await redisClient.hGetAll(buffer);

  const inData = {};
  const outData = {};

  for (const [field, value] of Object.entries(data)) {
    if (field.startsWith("in:")) {
      inData[field.replace("in:", "")] = Number(value);
    }

    if (field.startsWith("out:")) {
      outData[field.replace("out:", "")] = Number(value);
    }
  }

  // console.log(
  //   "[Buffers Queries] Status do buffer para",
  //   { shop, line, shift },
  //   { in: inData, out: outData },
  // );
  return {
    in: inData,
    out: outData,
  };
}
