/**
 * Limita a perda declarada de cada hora ao máximo de carros/hora permitido.
 *
 * A função trabalha no resultado de cap_get_prod_and_losses_cars(), sem alterar
 * a origem histórica. O objetivo é impedir que o gráfico CAP declare mais
 * perdas em uma hora do que o máximo de produção daquela hora.
 */

const isProductionRow = (row) =>
  String(row?.reasondesc ?? row?.reasonDesc ?? "").trim().toUpperCase() ===
  "REALIZADO";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getHourKey = (row) => {
  const ts = row?.ts_inicio;
  if (!ts) return "sem-hora";
  const date = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(date.getTime())) return String(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}`;
};

/**
 * Distribui o limite proporcionalmente entre as categorias de perda,
 * preservando números inteiros de carros e garantindo soma <= limite.
 */
function scaleLossRows(lossRows, maxLoss) {
  const total = lossRows.reduce((sum, row) => sum + Math.max(0, toNumber(row.valor)), 0);
  if (total <= maxLoss || maxLoss < 0) return lossRows;

  if (maxLoss === 0) {
    return lossRows.map((row) => ({ ...row, valor: 0 }));
  }

  const raw = lossRows.map((row) => (Math.max(0, toNumber(row.valor)) / total) * maxLoss);
  const floors = raw.map(Math.floor);
  let remaining = Math.max(0, Math.floor(maxLoss) - floors.reduce((a, b) => a + b, 0));

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (const item of order) {
    if (remaining <= 0) break;
    floors[item.index] += 1;
    remaining -= 1;
  }

  return lossRows.map((row, index) => ({
    ...row,
    valor: floors[index],
    valor_original: toNumber(row.valor),
    perda_limitada: true,
  }));
}

export function limitHourlyLosses(rows = [], maxJph) {
  const limit = Math.max(0, Math.floor(toNumber(maxJph)));
  const groups = new Map();

  rows.forEach((row, index) => {
    const key = getHourKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ row, index });
  });

  const result = [...rows];

  for (const entries of groups.values()) {
    const losses = entries
      .filter(({ row }) => !isProductionRow(row) && toNumber(row.valor) > 0)
      .map(({ row, index }) => ({ row, index }));

    const totalLoss = losses.reduce((sum, item) => sum + toNumber(item.row.valor), 0);
    const hourlyLimit = limit;

    if (totalLoss <= hourlyLimit) {
      losses.forEach(({ row, index }) => {
        result[index] = {
          ...row,
          valor_original: toNumber(row.valor),
          perda_limitada: false,
          jph_max: hourlyLimit,
        };
      });
      continue;
    }

    const scaled = scaleLossRows(losses.map((item) => item.row), hourlyLimit);
    scaled.forEach((row, i) => {
      result[losses[i].index] = {
        ...row,
        jph_max: hourlyLimit,
      };
    });
  }

  return result;
}
