// utils/dateUtils.js
import { getISOWeek, getYear } from "date-fns"; // npm i date-fns

export function checkDataInicio(dataInicio, anoParam, semanaParam) {
  if (!dataInicio) return { valid: false, reason: "Sem data de início" };

  const data = new Date(dataInicio);
  const anoData = getYear(data);
  const semanaData = getISOWeek(data);

  const valid =
    anoData === Number(anoParam) && semanaData === Number(semanaParam);

  return {
    valid,
    anoData,
    semanaData,
    dataInicio,
  };
}
