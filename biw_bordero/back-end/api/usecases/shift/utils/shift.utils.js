import { getShiftRules } from "../shift.pgService.js";

export function getCurrentShift(now = new Date()) {
  const rules = getShiftRules();
  if (!rules.length) return null;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const v_dow = now.getDay(); // 0=domingo

  for (const rule of rules) {
    const [sh, sm] = rule.start_time.split(":").map(Number);
    const [eh, em] = rule.end_time.split(":").map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    const isOvernight = startMinutes > endMinutes;

    let matchesTime = false;

    if (!isOvernight) {
      matchesTime = currentTime >= startMinutes && currentTime <= endMinutes;
    } else {
      matchesTime = currentTime >= startMinutes || currentTime <= endMinutes;
    }

    if (!matchesTime) continue;

    // Regra de Monday Special
    if (rule.is_monday_special) {
      if (![0, 1].includes(v_dow)) continue;
    }

    // Se chegou aqui, é o turno atual
    return buildShiftResult(rule, now);
  }

  return null;
}

function buildShiftResult(rule, now) {
  const baseDate = new Date(now);

  const [sh, sm] = rule.start_time.split(":").map(Number);
  const [eh, em] = rule.end_time.split(":").map(Number);

  const start_ts = new Date(baseDate);
  start_ts.setHours(sh, sm, 0, 0);

  let end_ts = new Date(baseDate);
  end_ts.setHours(eh, em, 0, 0);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const isOvernight = startMinutes > endMinutes;

  if (isOvernight) {
    if (now.getHours() * 60 + now.getMinutes() < endMinutes) {
      start_ts.setDate(start_ts.getDate() - 1);
    } else {
      end_ts.setDate(end_ts.getDate() + 1);
    }
  }

  const totalMs = end_ts - start_ts;
  const elapsedMs = now - start_ts;

  const durationCurrentHours = elapsedMs > 0 ? elapsedMs / (1000 * 60 * 60) : 0;

  const percentComplete =
    totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;

  return {
    Shift: rule.shift_number,
    StartTime: start_ts.toISOString(),
    EndTime: end_ts.toISOString(),

    DurationInHours: rule.duration_hours,
    DurationCurrentInHours: durationCurrentHours,

    PercentComplete: Number(percentComplete.toFixed(2)),

    duration_total: rule.duration_total,
    tc: rule.tc,
  };
}

