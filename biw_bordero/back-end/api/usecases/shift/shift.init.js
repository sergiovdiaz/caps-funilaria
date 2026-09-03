import { redisClient } from "../../conectores/redis/redis.connector.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";
import {
  getCurrentShiftFromDB,
  getCurrentShiftProduction,
  getLineTcTarget,
} from "./shift.pgService.js";
import { getCurrentShift } from "./utils/shift.utils.js";

/**
 * mode:
 *  - "ensure"     -> cria somente se não existir
 *  - "overwrite"  -> força atualização
 */
export async function ensureShiftInfo({ shop, mode = "ensure" }) {
  const shiftData = getCurrentShift();

  if (!shiftData) return null;

  const shift = shiftData.Shift;
  const keys = shiftKeys({ shop, shift });

  const data = {
    shiftStart: shiftData.StartTime,
    shiftEnd: shiftData.EndTime,
    durationHours: shiftData.DurationInHours,
    shiftNumber: shift,
  };

  if (mode === "overwrite") {
    await redisClient.hSet(keys.shiftInfo, data);
  } else {
    const exists = await redisClient.exists(keys.shiftInfo);
    console.log("Verificando existência de dados de turno no Redis:", exists);
    if (!exists) {
      await redisClient.hSet(keys.shiftInfo, data);
    }
  }

  return {
    shift,
    key: keys.shiftInfo,
  };
}

export async function ensureProductionShift({ shop, line, mode = "ensure" }) {
  var shiftData = getCurrentShift();
  // console.log("Dados atuais do turno:", shiftData);
  if (!shiftData) return null;

  const shift = shiftData.Shift;
  const keys = shiftKeys({ shop, line, shift });
  // console.log(`Garantindo dados de produção do turno no Redis para ${keys.productionShift} (modo: ${mode})...`);

  const exists = await redisClient.hExists(keys.productionShift, "impostado");
  // console.log(
  //   `Verificando existência de dados de produção do turno no Redis para ${keys.productionShift}:`,
  //   exists,
  // );

  if (mode === "overwrite" || !exists) {
    shiftData = await getCurrentShiftFromDB();
    // console.log("REESCREVENDO DADOS DE TURNO DE PRODUÇÃO NO REDIS", {
    //   shop,
    //   line,
    //   shift,
    // });
    const [tcTargetData, producedCount] = await Promise.all([
      getLineTcTarget(line),
      getCurrentShiftProduction(line),
    ]);

    const data = {
      count: producedCount || 0,
      impostado: shiftData.production_target,
      tcTarget: tcTargetData?.tc_target || 0,
    };

    await redisClient.hSet(keys.productionShift, data);
  }

  return {
    shift,
    key: keys.productionShift,
  };
}

export async function clearProductionShift({
  shop = "BiW",
  line = "*",
  shift = "*",
} = {}) {
  const { productionShift } = shiftKeys({ shop, line, shift });

  let cursor = "0";

  do {
    const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
      MATCH: productionShift,
      COUNT: 200,
    });

    cursor = nextCursor;

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } while (cursor !== "0");
}

