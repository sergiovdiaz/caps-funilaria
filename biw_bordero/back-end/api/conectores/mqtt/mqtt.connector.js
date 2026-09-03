// mqtt.connector.js

import mqtt from "mqtt";

import { routeMqttMessage } from "./mqtt.router.js";
import { MQTT_TOPICS } from "./mqtt.topics.js";

const client = mqtt.connect(process.env.MQTT_BROKER);

console.log("🔌 Conectando ao broker MQTT...");

client.on("connect", () => {
  console.log("✅ Conectado ao broker MQTT");

  Object.values(MQTT_TOPICS).forEach((topic) => {
    if (!topic) return;

    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Erro ao assinar ${topic}`, err);
      } else {
        console.log(`📡 Assinado: ${topic}`);
      }
    });
  });
});

client.on("message", routeMqttMessage);

client.on("error", (err) => console.error("Erro MQTT:", err));

client.on("close", () => console.log("Conexão MQTT encerrada"));

export { client };
