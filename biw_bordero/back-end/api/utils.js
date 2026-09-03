import fs from "fs";
import path from "path";
import sharp from "sharp";

// Função genérica para salvar Base64 como imagem
export async function saveBase64Image(
  base64String,
  outputDir,
  fileName,
  rotate = false
) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });

    const buffer = Buffer.from(base64String, "base64");
    const outputPath = path.join(outputDir, fileName);

    let image = sharp(buffer);

    // Se precisar rotacionar 90° antihorário
    if (rotate) {
      image = image.rotate(-90); // negativo = anti-horário
    }

    await image.toFile(outputPath);

    return outputPath;
  } catch (err) {
    console.error("Erro ao salvar imagem:", err);
    return null;
  }
}

export const formatTimestamp = (ts) => {
  if (!ts) return ""; // caso seja null ou undefined
  const date = new Date(ts);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // mês começa do 0
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// UTILITARIOS DAS QUERIES

export function transformarResumoTurnos(rows) {
  const resultado = {};

  rows.forEach(({ periodo, turnoid, ok, ko }) => {
    if (!resultado[periodo]) {
      resultado[periodo] = {};
    }
    resultado[periodo][turnoid] = { ok, ko };
  });

  return resultado;
}

export function transformarSemanas(rows) {
  const resultado = {};

  rows.forEach(({ semana_iso, turno, ok, ko }) => {
    if (!resultado[turno]) {
      resultado[turno] = { semana: [], ok: [], ko: [] };
    }
    resultado[turno].semana.push(semana_iso);
    resultado[turno].ok.push(ok);
    resultado[turno].ko.push(ko);
  });

  return resultado;
}

export function transformarDiasDaSemana(rows) {
  const resultado = {};

  rows.forEach(({ dia, turno, ok, ko }) => {
    if (!resultado[turno]) {
      resultado[turno] = { dia: [], ok: [], ko: [] };
    }
    resultado[turno].dia.push(dia);
    resultado[turno].ok.push(ok);
    resultado[turno].ko.push(ko);
  });

  return resultado;
}

export function transformarHoraria(rows) {
  return {
    intervalo: rows.map((r) => r.intervalo),
    ok: rows.map((r) => r.ok),
    ko: rows.map((r) => r.ko),
  };
}
