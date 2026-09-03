// Mapa de nomes amigáveis para os filtros
export const FILTER_LABELS = {
  hour: "Hora",
  status: "Status",
  cluster: "Tipo de Máquina",
  station: "Estação",
  machine: "Máquina",
  component: "Componente",
  shift_number: "Turno",
};

export const secondsToHHMMSS = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
};

export const groupByLossTime = (data, groupKey) => {
  const grouped = data.reduce((acc, item) => {
    const key = item[groupKey];
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + (item.losstime || 0);
    return acc;
  }, {});
  return Object.entries(grouped).map(([label, totalSeconds]) => ({
    label,
    value: totalSeconds,
  }));
};

export const getTopLossData = (data, groupKey, topN = 5) => {
  return groupByLossTime(data, groupKey)
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
};

export const getStatusClass = (value) => {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
};
