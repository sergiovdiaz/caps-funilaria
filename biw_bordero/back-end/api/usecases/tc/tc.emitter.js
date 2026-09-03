import { getTCAnalytics } from "./tc.queries.js";
import { io } from "../../server.js";

export async function emitTCDataUpdate(
  { line, stations, view = "station" },
  { type = "UPDATE", socket = null } = {},
) {
  try {
    if (!line) return;

    const data = await getTCAnalytics({ line, stations });
    if (!data || !data.machines) return;

    const room = `sinopticoAndon:${view}:${line}`;

    const eventPayload = {
      type,
      view,
      line,
      timestamp: new Date().toISOString(),
      payload: {
        entity: "machines",
        data: data.machines,
      },
    };

    // console.log(eventPayload);

    if (socket) {
      // 🔹 responde só para o cliente atual
      socket.emit("sinopticoAndon:update", eventPayload);
    } else {
      // 🔹 broadcast para todos da sala
      io.to(room).emit("sinopticoAndon:update", eventPayload);
    }
  } catch (err) {
    console.error("Erro emitTCDataUpdate:", err);
  }
}
