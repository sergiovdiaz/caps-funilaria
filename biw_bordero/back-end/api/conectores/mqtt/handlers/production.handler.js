// mqtt/handlers/production.handler.js

import { productionMessageHandler } from "../../../usecases/production/production.handler.js";

export function handleProduction(payload) {
  productionMessageHandler(payload);
}
