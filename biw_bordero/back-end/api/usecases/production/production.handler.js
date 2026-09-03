// production.handler.js
import { buildProductionContext } from "./production.builder.js";
import { registerProduction } from "./production.service.js";
import { emitProductionData } from "./production.emitter.js";
import { emitProductivityUpdate } from "../shift/shift.emitter.js";
import { ensureProductionShift } from "../shift/shift.init.js";

export async function productionMessageHandler(msg) {
  if (!msg?.Line) return;
  const shop = msg.Shop || "BiW";
  const line = msg.Line;

  // escreve no Redis
  const ctx = buildProductionContext(msg);
  if (!ctx) return;

  await registerProduction(ctx);
  await ensureProductionShift({ shop, line });

  emitProductionData(line);
  emitProductivityUpdate(line);
}
