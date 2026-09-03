// production.builder.js
import { shiftKeys } from "../../conectores/redis/redis.keys.js";
import { getCurrentShift } from "../shift/utils/shift.utils.js";

export function buildProductionContext(msg) {
  const shift = getCurrentShift().Shift;
  if (!shift) return null;

  const { Shop = "BiW", Line } = msg;
  if (!Line) return null;

  const keys = shiftKeys({ shop: Shop, line: Line, shift });
  if (!keys) return null;

  return {
    meta: {
      shop: Shop,
      line: Line,
      shift,
      ts: new Date(),
    },
    keys: {
      // contador acumulado do turno
      productionShift: keys.productionShift,

      // série temporal
      productionBucketBase: keys.productionBucketBase,
      productionIndex: keys.productionIndex,
    },
  };
}
