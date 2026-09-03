// shift.queries.js
import { redisClient } from "../../conectores/redis/redis.connector.js";
import { getCurrentShift } from "./utils/shift.utils.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";

export async function getShiftStatus({ shop = "BiW", line }) {
  if (!line) return null;

  const shift = getCurrentShift().Shift;
  if (!shift) return null;

  const keys = shiftKeys({ shop, line, shift });
  if (!keys) return null;

  const [prodCount, tcAvg, impostado] = await Promise.all([
    //  contador acumulado do turno
    redisClient.hGet(keys.productionShift, "count"),
    redisClient.hGet(keys.tc, "tc_avg"),
    redisClient.hGet(keys.tc, "impostado"),
  ]);
  // console.log(
  //   `Dados do turno para ${keys.productionShift}: count=${prodCount}, tc_avg=${tcAvg}`,
  // );

  const shiftInfo = getCurrentShift();
  if (!shiftInfo) return null;

  const production = Number(prodCount || 0);
  const duration = Number(shiftInfo.DurationCurrentInHours || 0);

  return {
    Shop: shop,
    Line: line,
    Shift: shift,
    Production: production,
    TC: Number(tcAvg || 0),
    LineSpeed: duration > 0 ? production / duration : 0,
  };
}

export async function getShiftStatus2({ shop = "BiW", line }) {
  if (!line) return null;

  const shiftInfo = getCurrentShift();
  if (!shiftInfo) return null;

  const shift = shiftInfo.Shift;
  const keys = shiftKeys({ shop, line, shift });
  if (!keys) return null;

  // Produção e metas
  const [prodCount, impostadoRaw, tcTargetRaw] = await Promise.all([
    redisClient.hGet(keys.productionShift, "count"),
    redisClient.hGet(keys.productionShift, "impostado"),
    redisClient.hGet(keys.productionShift, "tcTarget"),
  ]);

  const production = Number(prodCount || 0);
  const impostado = Number(impostadoRaw || 0);
  const tcTarget = Number(tcTargetRaw || 0);

  // 🔹 Pegar todas as métricas das STs
  const metricKeys = await redisClient.sMembers(keys.tcIndex);

  // Filtrar só STs
  const stKeys = metricKeys.filter((key) => {
    const [, , , st, maq] = key.split(":");
    return maq === "ST";
  });

  // Obter métricas de cada ST
  const stData = await Promise.all(
    stKeys.map(async (key) => {
      const [tcAvgRaw, tcCountRaw, tcOutCountRaw] = await Promise.all([
        redisClient.hGet(key, "tc_avg"),
        redisClient.hGet(key, "tc_count"),
        redisClient.hGet(key, "tc_out_count"),
      ]);

      const tcAvg = Number(tcAvgRaw || 0);
      const tcCount = Number(tcCountRaw || 0);
      const tcOutCount = Number(tcOutCountRaw || 0);

      const percentInTarget = tcCount > 0 ? tcOutCount / tcCount : 0;

      const [, , , stName] = key.split(":");

      return {
        key,
        stName,
        tcAvg,
        tcCount,
        tcOutCount,
        percentInTarget,
      };
    }),
  );

  // 🔹 Selecionar a ST com maior % dentro do target
  const bestST = stData.reduce(
    (prev, curr) =>
      curr.percentInTarget > (prev?.percentInTarget || 0) ? curr : prev,
    null,
  );

  const tc = bestST ? bestST.tcAvg : 0;
  const tcStBottleneck = bestST ? bestST.stName : null;

  // Cálculos de turno
  const duration = Number(shiftInfo.DurationCurrentInHours || 0);
  const percentComplete = Number(shiftInfo.PercentComplete || 0);

  const jph = duration > 0 ? production / duration : 0;
  const theoretical = Math.floor((percentComplete / 100) * impostado);
  const delta = production - theoretical;
  const efficiency = theoretical > 0 ? production / theoretical : 0;

  return {
    realizado: production,
    teorico: Number(theoretical.toFixed(2)),
    impostado,
    delta: Number(delta.toFixed(2)),
    eficiencia: Number((efficiency * 100).toFixed(1)),
    jph: Number(jph.toFixed(1)),
    tc: Number(tc.toFixed(1)), // <-- tc da ST com maior % no target
    tcStBottleneck,
    tcTarget,
  };
}
