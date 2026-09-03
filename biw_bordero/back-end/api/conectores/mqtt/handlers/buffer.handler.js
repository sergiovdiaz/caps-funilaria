// mqtt/handlers/buffer.handler.js

import { buffersMessageHandler } from "../../../usecases/buffers/buffers.handler.js";

export function handleBuffer(payload) {
  buffersMessageHandler(payload);
}
