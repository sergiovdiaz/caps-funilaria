//linestatus.init.js
import {
  loadLinestatusRulesFromDB,
  loadLinestatusStationsFromDB,
} from "./linestatus.pgService.js";
import { setLinestatusRules } from "./utils/linestatus.priority.js";
import { setLinestatusStations } from "./utils/linestatus.stationMap.js";

export async function initLinestatusRules() {
  try {
    const rules = await loadLinestatusRulesFromDB();
    setLinestatusRules(rules);

    const lineStation = await loadLinestatusStationsFromDB();
    setLinestatusStations(lineStation);
    // console.log(lineStation);
    console.log("✅ Linestatus rules carregadas:", rules.length);
  } catch (err) {
    console.error("❌ Erro ao carregar linestatus rules:", err);
  }
}
