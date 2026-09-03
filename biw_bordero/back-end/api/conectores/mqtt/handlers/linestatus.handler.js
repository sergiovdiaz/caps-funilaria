// mqtt/handlers/linestatus.handler.js

import { linestatusMessageHandler } from "../../../usecases/linestatus/linestatus.handler.js";

export function handleLineStatus(topic, payload) {
  linestatusMessageHandler(topic, payload);
}
