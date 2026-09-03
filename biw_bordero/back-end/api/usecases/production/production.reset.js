import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";

export async function resetAllProduction(line, shift, shop = "BiW") {
  const keysObj = shiftKeys({ shop, line, shift });

  // 🔹 Caso específico
  if (line && shift) {
    await redisClient.unlink(keysObj.productionShift);
    console.log(`[Redis] Produção deletada: ${keysObj.productionShift}`);
    return;
  }

  // 🔹 Caso geral (usa wildcard automático)
  const pattern = keysObj.productionShift; // já vem com *

  const keys = await redisClient.keys(pattern);

  if (keys.length === 0) {
    console.log("[Redis] Nenhuma chave encontrada");
    return;
  }

  await redisClient.unlink(keys);

  console.log(`[Redis] ${keys.length} shifts deletados com sucesso`);
}
