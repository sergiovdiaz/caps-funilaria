import { scheduleEvery } from "../../server/schedule/scheduler.js";
import { emitProductivityUpdate } from "./shift.emitter.js";
import { io } from "../../server.js";

const ONE_MINUTE = 60 * 1000;

export function startAndonSchedulers() {
  scheduleEvery(ONE_MINUTE, async () => {
    try {
      const rooms = io.sockets.adapter.rooms;

      for (const [roomName, sockets] of rooms) {
        if (!roomName.startsWith("sinopticoAndon:productivity:")) continue;

        if (sockets.size === 0) continue;

        const [, , line] = roomName.split(":");
        console.log("Rodando agendamento para: ", line);

        await emitProductivityUpdate(line, {
          type: "SNAPSHOT",
          io,
        });
      }
    } catch (err) {
      console.error("Erro no scheduler productivity:", err);
    }
  });
}
