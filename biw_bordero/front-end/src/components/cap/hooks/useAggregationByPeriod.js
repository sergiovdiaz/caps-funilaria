import { useMemo } from "react";

export function useAggregationByPeriod(
  data,
  metric = "dur_min",
  level = "week",
) {
  return useMemo(() => {
    if (!data) return [];

    const map = {};

    for (const item of data) {
      let key;

      switch (level) {
        case "month":
          key = item.mes; // 2026-06
          break;

        case "week":
          key = item.semana; // 2026-23
          break;

        default:
          key = item.data; // 2026-06-01
      }

      map[key] = (map[key] || 0) + Number(item[metric] || 0);
    }

    return Object.entries(map)
      .map(([period, total]) => ({
        period,
        total: Number(total.toFixed(2)),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [data, metric, level]);
}
