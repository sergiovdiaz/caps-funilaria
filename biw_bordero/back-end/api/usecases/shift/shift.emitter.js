import { io } from "../../server.js";
import { getShiftStatus2 } from "./shift.queries.js";
import { ensureProductionShift } from "./shift.init.js";
import { EMIT_TYPES } from "../../server/websocket/utils/emit.types.js";

export const emitProductivityUpdate = async (
  line,
  {
    type = EMIT_TYPES.UPDATE,
    socket = null, //  opcional
  } = {},
) => {
  try {
    const room = `sinopticoAndon:productivity:${line}`;

    await ensureProductionShift({
      shop: "BiW",
      line,
      mode: "ensure",
    });

    const shift = await getShiftStatus2({ line });

    const eventPayload = {
      type,
      view: "productivity",
      line,
      timestamp: new Date().toISOString(),
      payload: shift,
    };

    if (socket) {
      // 🔹 Responde apenas para o cliente atual
      socket.emit("sinopticoAndon:update", eventPayload);
      // console.log(`${type} (socket) → ${socket.id}`);
    } else {
      // 🔹 Broadcast para a sala
      io.to(room).emit("sinopticoAndon:update", eventPayload);
      // console.log(`${type} (room) → ${room}`);
    }
  } catch (err) {
    console.error("Erro emitProductivityUpdate:", err);
  }
};
