// buffers.handler.js
import { EMIT_TYPES } from "../../server/websocket/utils/emit.types.js";
import { registerBuffer } from "./buffers.service.js";
import { emitBufferUpdate } from "./buffers.emitter.js";

export async function buffersMessageHandler(msg) {
  try {
    const { Shop = "BiW", In: inLine, Out: outLine, Value = 1 } = msg || {};

    if (!inLine || !outLine) {
      console.warn("⚠️ Buffer ignorado - In ou Out ausente");
      return;
    }

    // 🔹 Registra buffer na hash de production
    await registerBuffer({
      shop: Shop,
      inLine,
      outLine,
      value: Number(Value) || 1,
    });

    // 🔹 Emite update para as duas linhas envolvidas
    await emitBufferUpdate(outLine, {
      type: EMIT_TYPES.UPDATE,
      
    });

    await emitBufferUpdate(inLine, {
      type: EMIT_TYPES.UPDATE,
     
    });
  } catch (err) {
    console.error("❌ Erro buffersMessageHandler:", err);
  }
}
