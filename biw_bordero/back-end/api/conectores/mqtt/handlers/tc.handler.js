// mqtt/handlers/tc.handler.js

import { io } from "../../../server.js";
import {
  addTCMessage,
  getTCMessages,
  getTCAnalytics2,
} from "../../../tcData.js";

import { tcMessageHandler } from "../../../usecases/tc/tc.handler.js";

export function handleTC(payload) {
  const { Line, ST, Maq } = payload;

  addTCMessage(payload);
  tcMessageHandler(payload);

  const room = `tcdata/${Line}${ST}${Maq}`;

  io.to(room).emit(room, {
    dados: getTCMessages(Line, ST, Maq),
    analytics: getTCAnalytics2(Line, ST, Maq),
  });
}
