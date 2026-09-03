// linestatus/linestatus.messageHandler.js

import { getLinestatusRuleByPriority } from "./utils/linestatus.priority.js";
import { saveLinestatus } from "./linestatus.service.js";
import { emitLinestatusUpdate } from "./linestatus.emitter.js";

export async function linestatusMessageHandler(topic, msg) {
  try {
    if (!msg?.priority) {
      console.warn("⚠️ Linestatus ignorado - priority ausente");
      return;
    }

    const parts = topic.split("/");
    const lastSegment = parts[parts.length - 1];
    const line = msg.line;

    const rule = getLinestatusRuleByPriority(msg.priority);

    if (!rule) {
      console.warn("⚠️ Regra não encontrada para priority:", msg.priority);
      return;
    }

    const basePayload = {
      priority: msg.priority,
      andondesc: rule.andondesc,
      color_hex: rule.color_hex,
      alarm: msg.alarm,
      timestamp: msg.timestamp,

      station: msg.station || null,
      element: msg.element || null,
      component: msg.component || null,
      event_id: msg.event_id || null,
    };

    if (lastSegment === "line") {
      await saveLinestatus({
        line,
        type: "line",
        data: basePayload,
      });

      await emitLinestatusUpdate(line);
      return;
    }

    const station = lastSegment;

    await saveLinestatus({
      line,
      type: "station",
      station,
      data: {
        ...basePayload,
        element: msg.element,
        component: msg.component,
      },
    });

    await emitLinestatusUpdate(line);
  } catch (err) {
    console.error("❌ Erro linestatusMessageHandler:", err);
  }
}
