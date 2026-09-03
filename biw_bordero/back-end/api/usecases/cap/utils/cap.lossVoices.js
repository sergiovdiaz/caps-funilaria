/**
 * Regras de classificação das perdas do CAP.
 * Base: documento "demandas do CAP" (03/09/2026).
 *
 * IMPORTANTE:
 * - A classificação é feita no backend antes de devolver/salvar o dado.
 * - Não inventamos novas categorias: são as 12 categorias do documento.
 * - A exceção PPA + Quebras -> Missing Body vem explicitamente do documento.
 */

export const LOSS_VOICES = Object.freeze({
  NEW_PRODUCT_PROCESS: "New Product/Process",
  CYCLE_TIME_LOSSES: "Cycle time losses",
  QUALITY_LOCK: "Quality lock (exped/Delivery)",
  LINE_STOPPAGES: "Line Stoppages",
  FUNCTIONAL_STOPS: "Functional stops",
  SATURATION: "Saturation",
  BREAKDOWN_TIME: "Breakdown time",
  MISSING_PART_SUPPLIER: "Missing part - Supplier",
  MISSING_BODY: "Missing Body",
  ENERGY_IT: "Energy / IT",
  KITTING_STOPPAGES: "Kitting stoppages",
  MISSING_PART_INTERNAL: "Missing Part - Internal Log",
  UNSPECIFIED: "Unspecified losses",
});

export const LOSS_VOICE_RESULTS = Object.freeze({
  [LOSS_VOICES.NEW_PRODUCT_PROCESS]: "Induced Dow Time",
  [LOSS_VOICES.CYCLE_TIME_LOSSES]: "Loss of time cycle",
  [LOSS_VOICES.QUALITY_LOCK]: "Quality Loss",
  [LOSS_VOICES.LINE_STOPPAGES]: "Operating Loss",
  [LOSS_VOICES.FUNCTIONAL_STOPS]: "Functional stops",
  [LOSS_VOICES.SATURATION]: "Induced Dow Time",
  [LOSS_VOICES.BREAKDOWN_TIME]: "Equipment failures",
  [LOSS_VOICES.MISSING_PART_SUPPLIER]: "Losses Product/Process",
  [LOSS_VOICES.MISSING_BODY]: "Induced Dow Time",
  [LOSS_VOICES.ENERGY_IT]: "Induced Dow Time",
  [LOSS_VOICES.KITTING_STOPPAGES]: "Induced Dow Time",
  [LOSS_VOICES.MISSING_PART_INTERNAL]: "Induced Dow Time",
  [LOSS_VOICES.UNSPECIFIED]: "Unspecified losses",
});

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const GROUP_ALIASES = new Map([
  ["new product/process", LOSS_VOICES.NEW_PRODUCT_PROCESS],
  ["new product process", LOSS_VOICES.NEW_PRODUCT_PROCESS],
  ["novo produto/processo", LOSS_VOICES.NEW_PRODUCT_PROCESS],

  ["cycle time losses", LOSS_VOICES.CYCLE_TIME_LOSSES],
  ["perda de tempo ciclo", LOSS_VOICES.CYCLE_TIME_LOSSES],
  ["perda de tempo de ciclo", LOSS_VOICES.CYCLE_TIME_LOSSES],

  ["quality lock (exped/delivery)", LOSS_VOICES.QUALITY_LOCK],
  ["quality lock", LOSS_VOICES.QUALITY_LOCK],
  ["perda de qualidade", LOSS_VOICES.QUALITY_LOCK],

  ["line stoppages", LOSS_VOICES.LINE_STOPPAGES],
  ["line stopages", LOSS_VOICES.LINE_STOPPAGES],
  ["perda operacional", LOSS_VOICES.LINE_STOPPAGES],

  ["functional stops", LOSS_VOICES.FUNCTIONAL_STOPS],
  ["paradas funcionais", LOSS_VOICES.FUNCTIONAL_STOPS],
  ["microparadas", LOSS_VOICES.FUNCTIONAL_STOPS],

  ["saturation", LOSS_VOICES.SATURATION],
  ["saturacao", LOSS_VOICES.SATURATION],

  ["breakdown time", LOSS_VOICES.BREAKDOWN_TIME],
  ["breakdown", LOSS_VOICES.BREAKDOWN_TIME],
  ["quebras", LOSS_VOICES.BREAKDOWN_TIME],
  ["falha equipamento", LOSS_VOICES.BREAKDOWN_TIME],
  ["falhas de equipamentos", LOSS_VOICES.BREAKDOWN_TIME],

  ["missing part - supplier", LOSS_VOICES.MISSING_PART_SUPPLIER],
  ["missing part supplier", LOSS_VOICES.MISSING_PART_SUPPLIER],
  ["missing part - fornecedor", LOSS_VOICES.MISSING_PART_SUPPLIER],

  ["missing body", LOSS_VOICES.MISSING_BODY],
  ["falta de carroceria", LOSS_VOICES.MISSING_BODY],

  ["energy / it", LOSS_VOICES.ENERGY_IT],
  ["energy/it", LOSS_VOICES.ENERGY_IT],
  ["energy it", LOSS_VOICES.ENERGY_IT],
  ["energia / it", LOSS_VOICES.ENERGY_IT],

  ["kitting stoppages", LOSS_VOICES.KITTING_STOPPAGES],
  ["paradas de kitting", LOSS_VOICES.KITTING_STOPPAGES],

  ["missing part - internal log", LOSS_VOICES.MISSING_PART_INTERNAL],
  ["missing part - internal", LOSS_VOICES.MISSING_PART_INTERNAL],
  ["missing part internal log", LOSS_VOICES.MISSING_PART_INTERNAL],
  ["falta de material ou pecas", LOSS_VOICES.MISSING_PART_INTERNAL],

  ["unspecified losses", LOSS_VOICES.UNSPECIFIED],
  ["perda nao especificada", LOSS_VOICES.UNSPECIFIED],
  ["não justificado", LOSS_VOICES.UNSPECIFIED],
  ["nao justificado", LOSS_VOICES.UNSPECIFIED],
]);

/**
 * Classifica a voz final.
 *
 * Regra especial documentada:
 * PPA + Quebras/Breakdown -> Missing Body.
 * As demais regras seguem o quadro de classificação do documento.
 */
export function classifyLossVoice({ line, reasonDesc, group, voz } = {}) {
  // Produção não é uma categoria de perda/voz.
  const normalizedReason = normalize(reasonDesc);
  const normalizedGroup = normalize(group);
  if (normalizedReason === "realizado" || normalizedGroup === "realizado") {
    return { group: null, voice: null, source: "production" };
  }

  // Se já veio uma voz válida do banco, preserva-a.
  if (voz && Object.prototype.hasOwnProperty.call(LOSS_VOICE_RESULTS, voz)) {
    return { group: voz, voice: LOSS_VOICE_RESULTS[voz], source: "database" };
  }

  const normalizedLine = normalize(line);

  // Exceção explícita do CAP: impacto de quebra na PPA = Missing Body.
  if (
    normalizedLine === "ppa" &&
    (normalizedReason === "quebras" ||
      normalizedReason === "breakdown" ||
      normalizedReason === "breakdown time" ||
      normalizedReason.includes("falha equipamento"))
  ) {
    return {
      group: LOSS_VOICES.MISSING_BODY,
      voice: LOSS_VOICE_RESULTS[LOSS_VOICES.MISSING_BODY],
      source: "rule:PPA+breakdown",
    };
  }

  const groupKey = GROUP_ALIASES.get(normalizedGroup);
  if (groupKey) {
    return { group: groupKey, voice: LOSS_VOICE_RESULTS[groupKey], source: "group" };
  }

  const reasonKey = GROUP_ALIASES.get(normalizedReason);
  if (reasonKey) {
    return { group: reasonKey, voice: LOSS_VOICE_RESULTS[reasonKey], source: "reasonDesc" };
  }

  return {
    group: LOSS_VOICES.UNSPECIFIED,
    voice: LOSS_VOICE_RESULTS[LOSS_VOICES.UNSPECIFIED],
    source: "fallback",
  };
}

export function classifyLossRows(rows = []) {
  return rows.map((row) => {
    const classification = classifyLossVoice({
      line: row.line,
      reasonDesc: row.reasonDesc ?? row.reasondesc,
      group: row.group ?? row.loss_group,
      voz: row.voz,
    });

    return {
      ...row,
      voz: classification.group,
      tipo_perda: classification.voice,
      voz_source: classification.source,
    };
  });
}
