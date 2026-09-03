// production.emitter.js
import { getProductionSeries } from "./production.queries.js";
import { io } from "../../server.js";

export const emitProductionData = async (line, socket = null) => {
  const productionSeries = await getProductionSeries({ line });
  // console.log(
  //   `[EMIT][Production] Line: ${line}`,
  //   productionSeries.series[0].data,
  // );

  const emitter = socket ?? io.sockets;
  emitter.emit(`productiondata/${line}`, productionSeries);
};
