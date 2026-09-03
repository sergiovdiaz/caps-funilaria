// mqtt.router.js

import { MQTT_TOPICS, MQTT_REGEX } from "./mqtt.topics.js";
import { handleProduction } from "./handlers/production.handler.js";
import { handleTC } from "./handlers/tc.handler.js";
import { handleCA } from "./handlers/ca.handler.js";
import { handleBuffer } from "./handlers/buffer.handler.js";
import { handleLineStatus } from "./handlers/linestatus.handler.js";
import { isValidTcMessage } from "./mqtt.filters.js";

export async function routeMqttMessage(topic, message) {
  const payload = JSON.parse(message.toString());

  if (MQTT_REGEX.production.test(topic)) return handleProduction(payload);

  if (topic === MQTT_TOPICS.losses) return handleLosses(payload);

  if (MQTT_REGEX.tc.test(topic)) return handleTC(payload);

  if (MQTT_REGEX.ca.test(topic)) return handleCA(payload);

  if (MQTT_REGEX.buffer.test(topic)) return handleBuffer(payload);

  if (MQTT_REGEX.linestatus.test(topic))
    return handleLineStatus(topic, payload);

  console.log("Tópico não tratado:", topic);
}
