// tc.reset.js

import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";

async function scanKeys(pattern) {
  const foundKeys = [];
  let cursor = "0";

  do {
    const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });

    cursor = nextCursor;
    if (keys.length > 0) {
      foundKeys.push(...keys);
    }
  } while (cursor !== "0");

  return foundKeys;
}

export async function resetShiftTC(line, shift, shop = "BiW") {
  const keys = shiftKeys({
    shop,
    line: line || "*",
    shift: shift || "*",
  });

  // 🔹 Buscar todos os índices via SCAN
  const indexPattern = keys.tcIndex;
  const indexKeys = await scanKeys(indexPattern);

  if (indexKeys.length === 0) {
    console.log("[Redis] Nenhum índice TC encontrado");
    return;
  }

  let totalMachines = 0;

  for (const idxKey of indexKeys) {
    const machineKeys = await redisClient.sMembers(idxKey);

    if (machineKeys.length > 0) {
      await redisClient.unlink(machineKeys);
      totalMachines += machineKeys.length;
    }

    await redisClient.unlink(idxKey);
  }

  console.log(
    `[Redis] Reset TC concluído → ${totalMachines} máquinas removidas (${indexKeys.length} índices)`,
  );
}
