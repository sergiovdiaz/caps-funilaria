//tc.service.js
import { buildTCContext } from "./tc.builder.js";
import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";

const EVENTS_LIMIT = 30;

async function updateMetrics(metricsKey, tc, modelo, tcTarget) {
  await redisClient.hSet(metricsKey, "tc_last", tc);

  const min = await redisClient.hGet(metricsKey, "tc_min");
  if (!min || tc < Number(min))
    await redisClient.hSet(metricsKey, "tc_min", tc);

  const count = await redisClient.hIncrBy(metricsKey, "tc_count", 1);
  await redisClient.hIncrByFloat(metricsKey, "tc_sum", tc);

  if (tc > tcTarget) {
    await redisClient.hIncrBy(metricsKey, "tc_above_target", 1);
    await redisClient.hIncrByFloat(metricsKey, "tc_out_sum", tc);
    await redisClient.hIncrBy(metricsKey, "tc_out_count", 1);
  }

  // Atualiza métricas por modelo dentro do hash
  const modelPrefix = `models.${modelo}`;
  await redisClient.hIncrBy(metricsKey, `${modelPrefix}.count`, 1);
  await redisClient.hIncrByFloat(metricsKey, `${modelPrefix}.sum`, tc);
  if (tc > tcTarget) {
    await redisClient.hIncrBy(metricsKey, `${modelPrefix}.out_count`, 1);
    await redisClient.hIncrByFloat(metricsKey, `${modelPrefix}.out_sum`, tc);
  }

  const sum = Number((await redisClient.hGet(metricsKey, "tc_sum")) || 0);
  const avg = count > 0 ? sum / count : 0;
  await redisClient.hSet(metricsKey, "tc_avg", avg.toFixed(2));

  // último TC por modelo
  await redisClient.hSet(metricsKey, `${modelPrefix}.last`, tc);

  // mínimo por modelo
  const modelMin = await redisClient.hGet(metricsKey, `${modelPrefix}.min`);
  if (!modelMin || tc < Number(modelMin)) {
    await redisClient.hSet(metricsKey, `${modelPrefix}.min`, tc);
  }
}

async function pushEvent(eventsKey, event) {
  await redisClient.lPush(eventsKey, JSON.stringify(event));
  await redisClient.lTrim(eventsKey, 0, EVENTS_LIMIT - 1);
}

export async function processTCMessage(msg) {
  const ctx = buildTCContext(msg);
  const { tc } = ctx.values;

  //  Se TC for maior que 200, ignora a mensagem
  if (tc > 200) {
    // console.log(`[TC] Ignorado TC > 200: ${tc}`);
    // console.log(msg);
    return;
  }

  const { modelo, turno } = ctx.meta;
  const { shop, line, st, maq } = ctx.meta;

  // 🔹 0️⃣ Buscar TC TARGET do turno no Redis
  const { productionShift } = shiftKeys({ shop, line, shift: turno });

  const tcTargetRaw = await redisClient.hGet(productionShift, "tcTarget");
  const tcTarget = Number(tcTargetRaw || 50);

  // 1️⃣ Atualiza métricas da máquina + modelo (agora com target dinâmico)
  await updateMetrics(ctx.keys.machine.metrics, tc, modelo, tcTarget);

  // 2️⃣ Registra eventos
  await pushEvent(ctx.keys.machine.events, {
    tc,
    modelo,
    turno,
    ts: ctx.meta.timestamp.toISOString(),
  });

  // 3️⃣ INDEX POR LINHA + TURNO
  const { tcIndex } = shiftKeys({ shop, line, shift: turno });
  await redisClient.sAdd(tcIndex, ctx.keys.machine.metrics);

  // 4️⃣ META DA MÁQUINA (idempotente)
  const { tcMeta } = shiftKeys({ shop, line, st, maq });
  await redisClient.hSet(tcMeta, { shop, line, st, maq });
}
