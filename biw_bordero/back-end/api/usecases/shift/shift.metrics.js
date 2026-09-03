// shift.metrics.js
import { actualShiftInfo } from "../utils/shift.utils.js";

export function calculateShiftMetrics(raw) {
  if (!raw) return null;

  const shiftInfo = actualShiftInfo();
  if (!shiftInfo) return null;

  const duration = shiftInfo.DurationInHours || 0;
  const production = raw.production;

  const lineSpeed =
    duration > 0 ? production / duration : 0;

  // 🔧 regras de negócio (exemplo)
  const TARGET_SPEED = 20; // exemplo
  const outOfTarget = lineSpeed < TARGET_SPEED;

  return {
    Shop: raw.shop,
    Line: raw.line,
    Shift: raw.shift,

    Production: production,
    TC: raw.tc.avg,
    LineSpeed: lineSpeed,

    TargetSpeed: TARGET_SPEED,
    OutOfTarget: outOfTarget,

    ShiftInfo: shiftInfo,
  };
}
