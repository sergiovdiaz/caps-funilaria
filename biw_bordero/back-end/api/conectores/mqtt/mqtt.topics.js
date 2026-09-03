// mqtt.topics.js

const buildRegex = (topic) =>
  new RegExp("^" + topic.replace(/\+/g, "[^/]+").replace(/#/g, ".*") + "$");

// tc: "eMille/v1/Goi/testeTC/#",
export const MQTT_TOPICS = {
  production: process.env.MQTT_TOPIC,
  tc: "eMille/v1/Goi/TC/BiW/+/+/+",
  ca: process.env.MQTT_CATopic,
  savisionPuntone: "Goi/BiW/v1/SAVision/Puntone/Prediction",
  buffer: "Goi/BiW/v1/Buffer/#",
  linestatus: "Goi/Veh/BiW/Bordero/LineStatus/#",
};

export const MQTT_REGEX = {
  production: buildRegex(MQTT_TOPICS.production),
  tc: buildRegex(MQTT_TOPICS.tc),
  ca: buildRegex(MQTT_TOPICS.ca),
  buffer: buildRegex(MQTT_TOPICS.buffer),
  linestatus: buildRegex(MQTT_TOPICS.linestatus),
};
