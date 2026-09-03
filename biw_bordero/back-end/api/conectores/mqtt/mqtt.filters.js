import { MQTT_REGEX } from "./mqtt.topics.js";

const TC_MIN_DEPTH = 7;
// eMille/v1/Goi/TC/BiW/A/B/C => exemplo válido

export const isValidTcMessage = (topic) => {
  const depth = topic.split("/").length;

  return MQTT_REGEX.tc.test(topic) && depth > TC_MIN_DEPTH;
};
