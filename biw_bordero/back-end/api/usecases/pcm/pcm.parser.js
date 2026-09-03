// src/services/parserFimSemana.service.js

import * as XLSX from "xlsx";
import { checkDataInicio } from "./utils/dateUtils.js";

export async function parseExcel(fileBuffer, anoParam, semanaParam) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  const { registros: disponibilidade, weekMismatch } = parseDisponibilidade(
    workbook,
    anoParam,
    semanaParam,
  );

  const atividades = parseAtividades(workbook, anoParam, semanaParam);

  return { disponibilidade, atividades, weekMismatch };
}

// =============================
// PARSER LISTA DE PRESENÇA
// =============================

function parseDisponibilidade(workbook, anoParam, semanaParam) {
  const sheet = workbook.Sheets["LISTA DE PRESENÇA"];
  if (!sheet) return { registros: [], weekMismatch: null };

  const dataInicio = sheet["B2"]?.v;
  if (!dataInicio) return { registros: [], weekMismatch: null };

  // Converte a data do Excel
  let dataConvertida;
  if (typeof dataInicio === "number") {
    dataConvertida = parseExcelDate(dataInicio);
  } else {
    dataConvertida = new Date(dataInicio);
  }
  // console.log(dataConvertida);

  // Checagem de semana
  const dataCheck = checkDataInicio(dataConvertida, anoParam, semanaParam);
  if (!dataCheck.valid) {
    return {
      registros: [],
      weekMismatch: {
        requested: { ano: anoParam, semana: semanaParam },
        actual: {
          ano: dataCheck.anoData,
          semana: dataCheck.semanaData,
          dataInicio: dataCheck.dataInicio,
        },
      },
    };
  }

  const anoReferencia = dataConvertida.getFullYear();

  const jsonData = XLSX.utils.sheet_to_json(sheet, {
    range: 8,
    defval: null,
  });

  if (!jsonData.length) return { registros: [], weekMismatch: null };

  const registros = [];

  for (const row of jsonData) {
    if (row["REG"]) {
      processarBloco({
        reg: row["REG"],
        nome: row["NOME"],
        espec: row["ESPEC."],
        tipoContrato: "STELLANTIS",
        empresa: "STELLANTIS",
        row,
        anoReferencia,
        semanaParam,
        registros,
      });
    }

    if (row["REG_1"]) {
      processarBloco({
        reg: row["REG_1"],
        nome: row["NOME_1"],
        espec: row["ESPEC._1"],
        tipoContrato: "ASSISTÊNCIA",
        empresa: row["EMPRESA"]?.toString().trim() || null,
        row,
        anoReferencia,
        semanaParam,
        registros,
        sufixo: "_1",
      });
    }
  }

  console.log(`\n✅ Total de registros processados: ${registros.length}`);
  return { registros, weekMismatch: null };
}

function processarBloco({
  reg,
  nome,
  espec,
  tipoContrato,
  empresa,
  row,
  anoReferencia,
  semanaParam,
  registros,
  sufixo = "",
}) {
  const regNum = Number(String(reg).trim());
  if (isNaN(regNum)) return;

  const nomeLimpo = nome?.toString().trim() || null;
  const especLimpo = espec?.toString().trim() || null;

  for (const col of Object.keys(row)) {
    // Só pega colunas de data
    const dataMatch = col.match(/^(\d{2})\/(\d{2})/);
    if (!dataMatch) continue;

    // Se for assistência, só pega colunas _1
    if (sufixo === "_1" && !col.endsWith("_1")) continue;
    // Se for stellantis, ignora _1
    if (sufixo === "" && col.endsWith("_1")) continue;

    const valor = row[col];
    if (!valor) continue;

    // Parse do valor (ex: "1,5" ou "1.5" ou "1.5" ou "1.5")
    const turnoMatch = String(valor)
      .trim()
      .replace(",", ".")
      .match(/^([1-3])\.(\d{1,2})$/);

    if (!turnoMatch) continue;

    const turno = Number(turnoMatch[1]);
    const horas = Number(turnoMatch[2]);

    const dia = Number(dataMatch[1]);
    const mes = Number(dataMatch[2]);

    // Criar data BASE no fuso LOCAL (-3)
    const dataBase = new Date(anoReferencia, mes - 1, dia);
    if (isNaN(dataBase.getTime())) continue;

    // console.log(
    //   `\n📋 Processando: ${nomeLimpo} - ${dia}/${mes} - Turno ${turno}`,
    // );

    // Obter início do turno (já ajustado para fuso LOCAL)
    const inicio = getDataInicioTurno(turno, dataBase);
    if (!inicio || isNaN(inicio.getTime())) continue;

    // Calcular fim baseado nas horas trabalhadas
    const fim = new Date(inicio.getTime() + horas * 60 * 60 * 1000);

    // console.log("  ↳ Período:", {
    //   inicio: inicio.toLocaleString("pt-BR"),
    //   fim: fim.toLocaleString("pt-BR"),
    //   horas: horas,
    //   inicioUTC: inicio.toISOString(),
    //   fimUTC: fim.toISOString(),
    // });

    registros.push([
      anoReferencia, // ano
      semanaParam, // semana
      dataBase, // data (DATE)
      turno, // turno
      horas, // horas
      inicio, // inicio_disp (TIMESTAMPTZ)
      fim, // fim_disp (TIMESTAMPTZ)
      regNum, // reg
      nomeLimpo, // nome
      especLimpo, // espec
      empresa, // empresa
      tipoContrato, // tipo_contrato
    ]);
  }
}

// =============================
// PARSER PLANO CONTROLE
// =============================
function parseAtividades(workbook, anoParam, semanaParam) {
  const sheet = workbook.Sheets["PLANO CONTROLE"];
  if (!sheet) return [];

  const rawData = XLSX.utils.sheet_to_json(sheet, {
    range: 2,
    defval: null,
  });

  const atividades = [];

  const cleaned = rawData.map((row) => {
    const newRow = {};
    for (const key of Object.keys(row)) {
      const cleanKey = key.replace(/\s+/g, " ").trim();
      newRow[cleanKey] = row[key];
    }
    return newRow;
  });

  for (const row of cleaned) {
    if (!row["DATA"] || !row["TURNO"]) continue;

    const turno = Number(String(row["TURNO"]).match(/(\d)/)?.[1]);
    if (![1, 2, 3].includes(turno)) continue;

    // =========================
    // 1️⃣ TRATAR DATA ORIGINAL
    // =========================
    const dataOriginal = parseExcelDate(row["DATA"]);
    if (!dataOriginal || isNaN(dataOriginal.getTime())) continue;

    // =========================
    // 2️⃣ CRIAR CÓPIA PARA CÁLCULO DO HORÁRIO
    // =========================
    const dataParaCalculo = new Date(dataOriginal);
    if (turno === 3) dataParaCalculo.setDate(dataParaCalculo.getDate() + 1);

    // =========================
    // 3️⃣ COMBINAR HORÁRIO DE INÍCIO/FIM
    // =========================
    const inicioAtiv = combinarDataHora(dataParaCalculo, row["INÍCIO"]);
    const fimAtiv = combinarDataHora(dataParaCalculo, row["FIM"]);

    // ❌ Se não tiver DATA, INÍCIO, FIM, pula a linha
    if (!inicioAtiv || !fimAtiv) continue;

    // =========================
    // 4️⃣ VERIFICAR MÃO DE OBRA
    // =========================
    const mdoCols = ["MdO1", "MdO2", "MdO3", "MdO4"];
    const hasMdo = mdoCols.some((col) => row[col]);
    if (!hasMdo) continue; // ❌ pula se nenhuma mão de obra preenchida

    // =========================
    // 5️⃣ ADICIONAR REGISTROS
    // =========================
    for (const mdoCol of mdoCols) {
      const nome = row[mdoCol];
      if (!nome) continue;

      atividades.push([
        anoParam,
        semanaParam,
        row["MACRO ATIV."],
        row["STATUS PCM"],
        row["CRITICIDADE"],
        row["PRIORIDADE"],
        row["TIPO DE ATIVIDADE"],
        row["DIREC."],
        row["ORDEM"],
        dataOriginal,
        turno,
        row["GRUPO"],
        row["LINHA"],
        row["OP."],
        row["MÁQUINA"],
        row["ATIVIDADE"],
        String(nome).trim(),
        row["OBS."],
        row["PRÉ-DISPOSIÇÕES"],
        inicioAtiv,
        fimAtiv,
      ]);
    }
  }

  return atividades;
}

function combinarDataHora(data, horaValor) {
  if (!(data instanceof Date) || isNaN(data.getTime())) {
    console.warn("Data inválida em combinarDataHora:", data);
    return null;
  }

  if (horaValor === null || horaValor === undefined) return null;

  let horas, minutos;

  // Parse da hora (igual)
  if (typeof horaValor === "number") {
    const totalMinutos = Math.round(horaValor * 24 * 60);
    horas = Math.floor(totalMinutos / 60);
    minutos = totalMinutos % 60;
  } else {
    const partes = String(horaValor).trim().split(":");
    if (partes.length < 2) {
      console.warn("Hora inválida:", horaValor);
      return null;
    }
    horas = Number(partes[0]);
    minutos = Number(partes[1]);
  }

  if (
    isNaN(horas) ||
    isNaN(minutos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    console.warn("Hora fora do padrão:", horaValor);
    return null;
  }

  // IMPORTANTE: data já está no fuso local (-3)
  // Extrair componentes locais
  const ano = data.getFullYear();
  const mes = data.getMonth();
  const dia = data.getDate();

  // Criar nova data no fuso LOCAL (-3)
  const dataLocal = new Date(ano, mes, dia, horas, minutos, 0);

  // console.log("📅 combinarDataHora:", {
  //   dataBase: data.toLocaleString("pt-BR"),
  //   hora: `${horas}:${minutos}`,
  //   resultadoLocal: dataLocal.toLocaleString("pt-BR"),
  //   resultadoUTC: dataLocal.toISOString(), // Isso é o que vai pro banco
  // });

  return dataLocal; // Retorna data no fuso local, que ao salvar no banco vira UTC
}
const TURNOS = {
  1: { hora: 6, min: 0 }, // 06:00
  2: { hora: 15, min: 48 }, // 15:48
  3: { hora: 1, min: 9, diaSeguinte: true }, // 01:09 do dia seguinte
};

function getDataInicioTurno(turno, dataBase) {
  const config = TURNOS[turno];
  if (!config) return null;

  // Cria a data no fuso LOCAL (-3)
  const inicio = new Date(dataBase);

  // Ajusta para dia seguinte se necessário (turno 3)
  if (config.diaSeguinte) {
    inicio.setDate(inicio.getDate() + 1);
  }

  // Seta a hora no fuso LOCAL
  inicio.setHours(config.hora, config.min, 0, 0);

  // console.log("🎯 Turno:", turno, {
  //   dataBase: dataBase.toLocaleString("pt-BR"),
  //   inicioLocal: inicio.toLocaleString("pt-BR"),
  //   inicioUTC: inicio.toISOString(),
  // });

  return inicio; // Retorna Date no fuso LOCAL que será convertido para UTC ao salvar
}

function parseExcelDate(valor) {
  // Se já for Date válido
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return new Date(valor);
  }

  // Se for número (serial do Excel)
  if (typeof valor === "number") {
    // Excel serial para Date - retorna em UTC
    const utcDate = new Date(Math.round((valor - 25569) * 86400 * 1000));

    // CORREÇÃO: Converter de UTC para o fuso local (-3)
    // Extrair componentes em UTC
    const ano = utcDate.getUTCFullYear();
    const mes = utcDate.getUTCMonth();
    const dia = utcDate.getUTCDate();

    // Criar nova data no fuso LOCAL (-3) com o mesmo dia
    const localDate = new Date(ano, mes, dia, 0, 0, 0);

    // console.log("📊 parseExcelDate:", {
    //   valor,
    //   utc: utcDate.toISOString(),
    //   local: localDate.toLocaleString("pt-BR"),
    //   iso: localDate.toISOString(),
    // });

    return localDate;
  }

  // Se for string "DD/MM/AAAA"
  if (typeof valor === "string") {
    const partes = valor.trim().split("/");
    if (partes.length === 3) {
      const [dia, mes, ano] = partes.map(Number);
      if ([dia, mes, ano].some(isNaN)) return null;
      // Criar data no fuso LOCAL (-3)
      return new Date(ano, mes - 1, dia, 0, 0, 0);
    }
  }

  return null;
}
