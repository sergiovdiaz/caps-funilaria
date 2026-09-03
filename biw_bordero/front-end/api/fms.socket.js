import { socket } from "./api";

export const SOCKET_EVENTS = {
  FMS: "fms",
};

// =========================
// SUBSCRIBE / UNSUBSCRIBE
// =========================
export function subscribeFms() {
  console.log("Inscrição no FMS");
  socket.emit(SOCKET_EVENTS.FMS, {
    action: "subscribe",
  });
}

export function unsubscribeFms() {
  socket.emit(SOCKET_EVENTS.FMS, {
    action: "unsubscribe",
  });
}

// =========================
// UPDATE → alterar nível ou adicionar comentário
// =========================
export function updateFms({ alarmId, nivel, comment, token }) {
  socket.emit(SOCKET_EVENTS.FMS, {
    action: "update",
    alarmId,
    nivel,
    comment,
    token, // envia token se usuário estiver logado
  });
}

// =========================
// GETID → busca alarme específico pelo id
// =========================
export function getFmsById(alarmId) {
  socket.emit(SOCKET_EVENTS.FMS, {
    action: "getId",
    alarmId,
  });
}

// =========================
// OUVIR ATUALIZAÇÕES
// =========================
export function onFmsData(callback) {
  socket.on("fms:update", callback);
}

export function offFmsData(callback) {
  socket.off("fms:update", callback);
}

// =========================
// OUVIR RESULTADO DE GETID
// =========================
export function onFmsGetId(callback) {
  socket.on("fms:getId", callback);
}

export function offFmsGetId(callback) {
  socket.off("fms:getId", callback);
}

// =========================
// OUVIR ERROS
// =========================
export function onFmsError(callback) {
  socket.on("fms:error", callback);
}

export function offFmsError(callback) {
  socket.off("fms:error", callback);
}
