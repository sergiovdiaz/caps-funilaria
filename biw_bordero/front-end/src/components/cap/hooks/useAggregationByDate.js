//useAggregation.js
import { useMemo } from "react";

export function useAggregationByDate(data, metric = "dur_min") {
  return useMemo(() => {
    if (!data) return [];

    const map = {};

    for (const item of data) {
      const date = item.data;
      const value = parseFloat(item[metric] || 0);

      map[date] = (map[date] || 0) + value;
    }

    return Object.entries(map)
      .map(([date, total]) => ({
        date,
        total: Number(total.toFixed(2)),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data, metric]);
}
