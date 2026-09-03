import { pool } from "../../postgreConnect.js";
import { buildActiveFaults, buildHistoryFaults } from "./builders.js";

export async function updateAlarmNotification({
  alarmId,
  nivel,
  comment,
  matricula,
}) {
  const client = await pool.connect();
  console.log("opa");

  try {
    await client.query("BEGIN");

    // 1️⃣ Garante notificação do nível + confirmed_by
    const { rows } = await client.query(
      `
      INSERT INTO fms.alarm_notification (
        alarm_id,
        nivel,
        confirmed,
        confirmed_at,
        confirmed_by
      )
      VALUES ($1, $2, true, now(), $3)
      ON CONFLICT (alarm_id, nivel)
      DO UPDATE SET
        confirmed = true,
        confirmed_at = COALESCE(fms.alarm_notification.confirmed_at, now()),
        confirmed_by = COALESCE(fms.alarm_notification.confirmed_by, EXCLUDED.confirmed_by)
      RETURNING id
      `,
      [alarmId, nivel, matricula],
    );

    const notificationId = rows[0].id;

    // 2️⃣ Comentário (opcional)
    if (comment) {
      await client.query(
        `
        INSERT INTO fms.alarm_notification_comment (
          alarm_notification_id,
          comment,
          created_at,
          created_by
        )
        VALUES ($1, $2, now(), $3)
        `,
        [notificationId, comment, matricula],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// fmsPolling.js (ou no mesmo arquivo, mas fora do socket.on)

let fmsInterval = null;

export function startFmsPolling(io) {
  if (fmsInterval) return; // já está rodando

  console.log("▶️ Iniciando polling FMS");

  fmsInterval = setInterval(async () => {
    const roomSize = io.sockets.adapter.rooms.get("fms")?.size || 0;

    if (roomSize === 0) {
      console.log("⏸️ Nenhum cliente no FMS, polling ignorado");
      return;
    }

    const dados = await buildActiveFaults();
    const history = await buildHistoryFaults();

    io.to("fms").emit("fms:update", {
      ativo: dados,
      historico: history,
    });

    console.log("🔄 FMS update (polling)");
  }, 30000);
}

export function stopFmsPolling() {
  if (fmsInterval) {
    clearInterval(fmsInterval);
    fmsInterval = null;
    console.log("⏹️ Polling FMS parado");
  }
}
