import path from "path";
import fs from "fs/promises"; // usar fs/promises para poder usar await
import { saveBase64Image, formatTimestamp } from "./utils.js";
import { insertToTable } from "./postgreConnect.js";
import { querySavisionPuntone, querySavisionResumo } from "./postgreConnect.js";

const jsonFileName = "info_001.json"; // ex: info_001.json
const tablename = "savision_puntone";

// Função para pegar diretórios base (raw/prediction)
export function getSavisionDirs() {
  return {
    rawDir: "C:/savision/puntone/raw",
    predDir: "C:/savision/puntone/prediction",
    infoDir: "C:/savision/puntone/info",
    baseDir: "C:/savision/",
  };
}
export async function processPuntoneData(data) {
  const { rawDir, predDir, infoDir, baseDir } = getSavisionDirs();
  const infoPath = `${infoDir}/${jsonFileName}`;
  const jsonText = await fs.readFile(infoPath, "utf-8");
  const infoJson = JSON.parse(jsonText);

  let puntoneData = {
    info: { total: 0, ok: 0, ko: 0 },
    ...infoJson,
  };

  const timestamp = formatTimestamp(data._timestamp);

  const predFile = `${data._timestamp}_${data.CIS}.jpg`;
  const rawFile = `${data._timestamp}_${data.CIS}_raw.jpg`;

  const rawPath = await saveBase64Image(data.img, rawDir, rawFile, true);
  const predPath = await saveBase64Image(data.img_labeled, predDir, predFile);

  // substitui pelas paths relativas
  if (rawPath) data.img = path.relative(baseDir, rawPath);
  if (predPath) data.img_labeled = path.relative(baseDir, predPath);
  if (timestamp) data.timestamp = timestamp;

  // Incrementa os contadores
  const label = data.Label.toLowerCase();
  puntoneData.info.total = (puntoneData.info.total || 0) + 1;
  if (label && puntoneData.info.hasOwnProperty(label)) {
    puntoneData.info[label] = (puntoneData.info[label] || 0) + 1;
  }

  puntoneData = { ...puntoneData, ...data };

  // salvar novamente o JSON

  const jsonPath = path.join(infoDir, jsonFileName);

  await fs.writeFile(jsonPath, JSON.stringify(puntoneData, null, 2), "utf-8");

  insertToTable(tablename, {
    _timestamp: puntoneData._timestamp,
    usecase: puntoneData.Usecase,
    cis: puntoneData.CIS,
    side: puntoneData.Side,
    img_labeled: puntoneData.img_labeled,
    label: puntoneData.Label,
  });

  return puntoneData;
}

export async function getLastPuntoneRows() {
  return querySavisionPuntone(tablename, 1000);
}

export async function getPuntoneOverview() {
  return querySavisionResumo(tablename);
}



