export function mapTcHistory(rows = []) {
  const sts = new Set();
  const modelos = new Set();

  const average = {};
  const outPercentage = {};
  const outAverage = {};

  rows.forEach((r) => {
    const st = r.st;
    const model = r.model;

    sts.add(st);
    modelos.add(model);

    average[st] ??= {};
    outPercentage[st] ??= {};
    outAverage[st] ??= {};

    average[st][model] = r.average;
    outPercentage[st][model] = r.outPercentage;
    outAverage[st][model] = r.outAverage;
  });

  return {
    sts: Array.from(sts).filter((s) => s !== "Geral"),
    modelos: Array.from(modelos),
    average,
    outPercentage,
    outAverage,
  };
}
