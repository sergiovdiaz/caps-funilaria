import { io } from "../../server.js";
import { getBufferStatus } from "./buffers.queries.js";
import { EMIT_TYPES } from "../../server/websocket/utils/emit.types.js";

export const emitBufferUpdate = async (
  line,
  {
    type = EMIT_TYPES.UPDATE,
    socket = null, // 👈 opcional igual productivity
  } = {},
) => {
  try {
    const room = `sinopticoAndon:buffer:${line}`;

    const bufferData = await getBufferStatus({ line });

    const eventPayload = {
      type,
      view: "buffer",
      line,
      timestamp: new Date().toISOString(),
      payload: bufferData,
    };

    if (socket) {
      // 🔹 Responde apenas para o cliente atual (SNAPSHOT)
      socket.emit("sinopticoAndon:update", eventPayload);
      // console.log(`${type} (socket) → ${socket.id}`);
    } else {
      // 🔹 Broadcast para a sala (UPDATE)
      io.to(room).emit("sinopticoAndon:update", eventPayload);
      // console.log(`${type} (room) → ${room}`);
    }
  } catch (err) {
    console.error("Erro emitBufferUpdate:", err);
  }
};
