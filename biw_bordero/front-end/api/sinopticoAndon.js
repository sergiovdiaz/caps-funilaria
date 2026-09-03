// sinopticoAndon.socket.js
import { socket } from "./api";

export const SOCKET_EVENTS = {
  SINOPTICO_ANDON: "sinopticoAndon",
};

// 🔹 Inscreve para receber os dados iniciais e updates parciais
export function subscribeSinopticoAndon({ view, line }) {
  socket.emit(SOCKET_EVENTS.SINOPTICO_ANDON, {
    action: "subscribe",
    view,
    line,
  });
}

// 🔹 Cancela a inscrição
export function unsubscribeSinopticoAndon({ view, line }) {
  socket.emit(SOCKET_EVENTS.SINOPTICO_ANDON, {
    action: "unsubscribe",
    view,
    line,
  });
}

// 🔹 Callback para updates (parciais ou completos)
export function onSinopticoAndonData(callback) {
  socket.on(`${SOCKET_EVENTS.SINOPTICO_ANDON}:update`, callback);
}

// 🔹 Remove callback
export function offSinopticoAndonData(callback) {
  socket.off(`${SOCKET_EVENTS.SINOPTICO_ANDON}:update`, callback);
}
