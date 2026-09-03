// linestatus/linestatus.emitter.js

import { io } from "../../server.js";
import { EMIT_TYPES } from "../../server/websocket/utils/emit.types.js";
import { getLinestatus } from "./linestatus.queries.js";

export const emitLinestatusUpdate = async (
  line,
  { shop = "BiW", type = EMIT_TYPES.UPDATE, socket = null } = {},
) => {
  try {
    const room = `sinopticoAndon:linestatus:${line}`;

    // 🔹 Busca estado consolidado via queries
    const linestatus = await getLinestatus({ shop, line });

    const eventPayload = {
      type,
      view: "linestatus",
      line,
      timestamp: new Date().toISOString(),
      payload: linestatus,
    };

    // console.log(eventPayload)
    if (socket) {
      socket.emit("sinopticoAndon:update", eventPayload);
    } else {
      io.to(room).emit("sinopticoAndon:update", eventPayload);
    }
  } catch (err) {
    console.error("Erro emitLinestatusUpdate:", err);
  }
};
