import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";

export async function saveLinestatus({
  shop = "BiW",
  line,
  type, // "line" | "station"
  station, // opcional
  data,
}) {
  const { linestatus } = shiftKeys({ shop, line });

  const field = type === "line" ? "line" : `station:${station}`;

  await redisClient.hSet(linestatus, field, JSON.stringify(data));
}
