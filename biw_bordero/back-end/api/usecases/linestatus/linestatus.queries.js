// linestatus/linestatus.queries.js

import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";

/**
 * Retorna todo o linestatus de uma linha
 */
export async function getLinestatus({ shop = "BiW", line }) {
  const { linestatus } = shiftKeys({ shop, line });

  const rawData = await redisClient.hGetAll(linestatus);

  const parsed = {
    line: null,
    stations: {},
  };

  for (const field in rawData) {
    const value = safeParse(rawData[field]);

    if (field === "line") {
      parsed.line = value;
    } else if (field.startsWith("station:")) {
      const station = field.replace("station:", "");
      parsed.stations[station] = value;
    }
  }

  return parsed;
}

/**
 * Retorna apenas o status geral da linha
 */
export async function getLineStatus({ shop = "BiW", line }) {
  const { linestatus } = shiftKeys({ shop, line });

  const raw = await redisClient.hGet(linestatus, "line");

  return safeParse(raw);
}

/**
 * Retorna apenas uma station específica
 */
export async function getStationStatus({ shop = "BiW", line, station }) {
  const { linestatus } = shiftKeys({ shop, line });

  const raw = await redisClient.hGet(linestatus, `station:${station}`);

  return safeParse(raw);
}

/**
 * Helper seguro para parse JSON
 */
function safeParse(value) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
