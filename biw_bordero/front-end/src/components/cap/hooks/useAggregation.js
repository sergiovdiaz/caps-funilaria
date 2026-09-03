//useAggregation.js
// import { useMemo } from "react";

// export function useAggregation(data, field, metric = "dur_min") {
//   return useMemo(() => {
//     if (!data) return [];

//     const map = {};

//     for (const item of data) {
//       const key = item[field] || "NÃO IDENTIFICADO";
//       const value = parseFloat(item[metric] || 0);

//       map[key] = (map[key] || 0) + value;
//     }

//     return Object.entries(map)
//       .map(([name, total]) => ({
//         name,
//         total: Number(total.toFixed(2)),
//       }))
//       .sort((a, b) => b.total - a.total);
//   }, [data, field, metric]);
// }

// useAggregation.js
import { useMemo } from "react";

export function useAggregation(data, field, metric = "dur_min") {
  return useMemo(() => {
    if (!data) return [];

    const map = {};

    for (const item of data) {
      let key = item[field];

      // Se o campo for 'tecnologia', usa "NÃO IDENTIFICADO" para null
      // Senão, simplesmente ignora os nulls (não os inclui no resultado)
      if (key === null || key === undefined) {
        if (field === "tecnologia") {
          key = "NÃO IDENTIFICADO";
        } else {
          continue; // Pula este item, não adiciona ao gráfico
        }
      }

      const value = parseFloat(item[metric] || 0);
      map[key] = (map[key] || 0) + value;
    }

    return Object.entries(map)
      .map(([name, total]) => ({
        name,
        total: Number(total.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total);
  }, [data, field, metric]);
}
