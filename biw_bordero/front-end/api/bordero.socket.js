import { socket } from "./api";

export const SOCKET_EVENTS = {
  BORDERO: "bordero",
};

export function subscribeBordero({ view, line, date }) {
  socket.emit(SOCKET_EVENTS.BORDERO, {
    action: "subscribe",
    view,
    line,
    date: date ?? null,
  });
}

export function unsubscribeBordero({ view, line }) {
  socket.emit(SOCKET_EVENTS.BORDERO, {
    action: "unsubscribe",
    view,
    line,
  });
}

export function onBorderoData(callback) {
  socket.on("bordero:update", callback);
}

export function offBorderoData(callback) {
  socket.off("bordero:update", callback);
}
