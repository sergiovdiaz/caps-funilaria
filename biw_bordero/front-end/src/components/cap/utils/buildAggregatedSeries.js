export const buildAggregatedSeries = ({
  aggregated,
  limit = 5,
  groupOthers = true,
}) => {
  if (!aggregated || !aggregated.length) {
    return { categories: [], seriesData: [] };
  }

  // console.log(aggregated);
  // Ordena do maior para o menor
  const sorted = [...aggregated].sort((a, b) => b.total - a.total);

  // Se não tiver limite, retorna tudo
  if (!limit) {
    return {
      categories: sorted.map((item) => item.name),
      seriesData: sorted.map((item) => item.total),
    };
  }

  const sliced = sorted.slice(0, limit);

  if (!groupOthers) {
    return {
      categories: sliced.map((item) => item.name),
      seriesData: sliced.map((item) => item.total),
    };
  }

  const rest = sorted.slice(limit);

  let finalData = [...sliced];

  if (rest.length > 0) {
    const othersTotal = rest.reduce((sum, item) => sum + item.total, 0);

    finalData.push({
      name: "Outros",
      total: Number(othersTotal.toFixed(2)),
    });
  }

  return {
    categories: finalData.map((item) => item.name),
    seriesData: finalData.map((item) => item.total),
  };
};
