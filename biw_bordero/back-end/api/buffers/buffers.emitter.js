import { getBufferStatus } from "./buffers.queries.js";
import { ensureProductionShift } from "../production/production.service.js";
import { EMIT_TYPES } from "../socket/emit.types.js";
import { io } from "../../server.js";

export const emitBufferUpdate = async (
  line,
  { type = EMIT_TYPES.UPDATE, socket } = {},
) => {
  try {
    const emitter = socket || io;
    const room = `sinopticoAndon:buffer:${line}`;

    // await ensureProductionShift({
    //   shop: "BiW",
    //   line,
    //   mode: "ensure",
    // });

    const bufferData = await getBufferStatus({ line });

    emitter.to(room).emit("sinopticoAndon:buffer", {
      type,
      view: "buffer",
      line,
      timestamp: new Date().toISOString(),
      payload: bufferData,
    });

    console.log(`📡 Buffer ${type} → ${room}`);
  } catch (err) {
    console.error("❌ emitBufferUpdate:", err);
  }
};
