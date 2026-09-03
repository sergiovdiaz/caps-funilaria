import { resetAllProduction } from "../production/production.reset.js";
import { resetShiftTC } from "../tc/tc.reset.js";
import { ensureShiftInfo } from "./shift.init.js";

export async function resetAllShiftMetrics() {
  await resetAllProduction();
  await resetShiftTC();
  await ensureShiftInfo({ mode: "overwrite" }); 
  console.log("[Redis] Todos os dados de shift resetados");
}
