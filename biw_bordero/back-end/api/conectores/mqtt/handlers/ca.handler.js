// mqtt/handlers/ca.handler.js

import { io } from "../../../server.js";
import { addCAMessage, getCAMessages } from "../../../caData.js";

export function handleCA(payload) {
  const { Line, Station, Machine } = payload;

  addCAMessage(payload);

  const room = `cadata/${Line}_${Station}_${Machine}`;

  io.to(room).emit(room, getCAMessages(Line, Station, Machine));
}
