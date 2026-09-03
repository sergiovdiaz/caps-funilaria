// tc.queries.js
import { redisClient } from "../../conectores/redis/redis.connector.js";
import { getCurrentShift } from "../shift/utils/shift.utils.js";
import { shiftKeys } from "../../conectores/redis/redis.keys.js";
import { getLinestatusStationsByLinha } from "../linestatus/utils/linestatus.stationMap.js";

// export async function getTCAnalytics({ shop = "BiW", line, shift, stations }) {
//   // console.log("[TC Queries] Consultando analytics para", {
//   //   shop,
//   //   line,
//   //   shift,
//   //   stations,
//   // });
//   if (!line) return {};

//   const effectiveShift = shift ?? getCurrentShift().Shift;
//   if (!effectiveShift) return {};

//   const { tcIndex } = shiftKeys({ shop, line, shift: effectiveShift });
//   const metricKeys = await redisClient.sMembers(tcIndex);

//   if (!metricKeys.length) {
//     return { shop, line, shift: effectiveShift, machines: [] };
//   }

//   const hasStationFilter = Array.isArray(stations) && stations.length > 0;

//   // Filtra as métricas que não interessam
//   const filteredKeys = metricKeys.filter((metricKey) => {
//     const [, , , st, maq] = metricKey.split(":");
//     if (!hasStationFilter) return true;

//     return stations.some((f) => {
//       if (f.st && f.st !== st) return false;
//       if (f.maq && f.maq !== maq) return false;
//       return true;
//     });
//   });

//   // Cria todas as promises de Redis em paralelo
//   const machinesPromises = filteredKeys.map(async (metricKey) => {
//     const [, , , st, maq] = metricKey.split(":");
//     const [data, meta] = await Promise.all([
//       redisClient.hGetAll(metricKey),
//       redisClient.hGetAll(`tc:meta:${shop}:${line}:${st}:${maq}`),
//     ]);

//     if (!data || !data.tc_count) return null;

//     const tcCount = Number(data.tc_count || 0);
//     const tcAvg = Number(data.tc_avg || 0);
//     const outCount = Number(data.tc_out_count || 0);
//     const outSum = Number(data.tc_out_sum || 0);
//     const outAverage =
//       outCount > 0 ? Number((outSum / outCount).toFixed(2)) : null;

//     const tcLast = Number(data.tc_last || 0);
//     const tcMin = Number(data.tc_min || 0);

//     const models = {};

//     Object.keys(data).forEach((field) => {
//       if (!field.startsWith("models.")) return;
//       const [, model, metric] = field.split(".");
//       if (!models[model]) {
//         models[model] = {
//           count: 0,
//           sum: 0,
//           out_count: 0,
//           out_sum: 0,
//           last: null,
//           min: null,
//         };
//       }
//       models[model][metric] = Number(data[field]);
//     });

//     Object.values(models).forEach((m) => {
//       if (m.count > 0) {
//         m.avg = Number((m.sum / m.count).toFixed(2));
//         m.outPercentage =
//           m.out_count && m.count
//             ? Number(((m.out_count / m.count) * 100).toFixed(1))
//             : 0;
//         m.outAverage =
//           m.out_count > 0 ? Number((m.out_sum / m.out_count).toFixed(2)) : null;
//       }
//       delete m.sum;
//       delete m.out_sum;
//     });

//     return {
//       st: meta.st || st,
//       maq: meta.maq || maq,
//       totalCount: tcCount,
//       average: Number(tcAvg.toFixed(2)),
//       last: tcLast,
//       min: tcMin,
//       outPercentage:
//         tcCount > 0 ? Number(((outCount / tcCount) * 100).toFixed(1)) : 0,
//       outAverage,
//       models,
//     };
//   });

//   const machines = (await Promise.all(machinesPromises)).filter(Boolean);

//   // console.log("Métricas de TC retornadas:", machines.length);
//   // Ordena alfabeticamente pelo st
//   machines.sort((a, b) => a.st.localeCompare(b.st));

//   return { shop, line, shift: effectiveShift, machines };
// }

export async function getTCAnalytics({ shop = "BiW", line, shift, stations }) {
  if (!line) return {};
  // console.log(stations);

  const effectiveShift = shift ?? getCurrentShift().Shift;
  if (!effectiveShift) return {};

  const { tcIndex } = shiftKeys({ shop, line, shift: effectiveShift });

  const allStations = getLinestatusStationsByLinha(line);
  if (!allStations?.length) {
    return { shop, line, shift: effectiveShift, machines: [] };
  }

  const hasStationFilter = Array.isArray(stations) && stations.length > 0;

  // ==============================
  // 🔥 BUSCA REDIS
  // ==============================

  const metricKeys = await redisClient.sMembers(tcIndex);

  const filteredKeys = (metricKeys || []).filter((metricKey) => {
    const parts = metricKey.split(":");

    const st = parts[3];
    const maq = parts[4];

    if (!hasStationFilter) return true;

    return stations.some((f) => {
      // 🔥 Se tiver ST no filtro → prioriza ST
      if (f.st) {
        if (f.st !== st) return false;

        // Se também tiver maq junto, valida também
        if (f.maq && f.maq !== maq) return false;

        return true;
      }

      // 🔥 Se NÃO tiver ST → usa só MAQ
      if (f.maq) {
        return f.maq === maq;
      }

      return false;
    });
  });
  const machinesFromRedis = (
    await Promise.all(
      filteredKeys.map(async (metricKey) => {
        const parts = metricKey.split(":");

        const st = parts[3];
        const maq = parts[4];

        const [data, meta] = await Promise.all([
          redisClient.hGetAll(metricKey),
          redisClient.hGetAll(`tc:meta:${shop}:${line}:${st}:${maq}`),
        ]);

        if (!data || !data.tc_count) return null;

        const tcCount = Number(data.tc_count || 0);
        const tcAvg = Number(data.tc_avg || 0);
        const outCount = Number(data.tc_out_count || 0);
        const outSum = Number(data.tc_out_sum || 0);

        return {
          st: meta?.st || st,
          maq: meta?.maq || maq,
          totalCount: tcCount,
          average: Number(tcAvg.toFixed(2)),
          last: Number(data.tc_last || 0),
          min: Number(data.tc_min || 0),
          outPercentage:
            tcCount > 0 ? Number(((outCount / tcCount) * 100).toFixed(1)) : 0,
          outAverage:
            outCount > 0 ? Number((outSum / outCount).toFixed(2)) : null,
          models: {},
        };
      }),
    )
  ).filter(Boolean);

  // 🔹 Map por ST + MAQ (IMPORTANTE!)
  const machinesMap = new Map(
    machinesFromRedis.map((m) => [`${m.st}:${m.maq}`, m]),
  );

  // ==============================
  // 🔥 MONTA RESULTADO FINAL
  // ==============================

  let stationsBase;

  // 🔥 Se houver filtro com ST → usa só elas
  if (hasStationFilter && stations.some((f) => f.st)) {
    stationsBase = [...new Set(stations.filter((f) => f.st).map((f) => f.st))];
  } else {
    stationsBase = allStations;
  }

  const machines = [];

  for (const st of stationsBase) {
    const foundMachines = machinesFromRedis.filter((m) => m.st === st);

    if (foundMachines.length) {
      machines.push(...foundMachines);
    } else {
      machines.push({
        st,
        maq: null,
        totalCount: 0,
        average: null,
        last: null,
        min: null,
        outPercentage: 0,
        outAverage: null,
        models: {},
      });
    }
  }

  machines.sort((a, b) => {
    if (a.st !== b.st) return a.st.localeCompare(b.st);
    return (a.maq || "").localeCompare(b.maq || "");
  });

  return {
    shop,
    line,
    shift: effectiveShift,
    machines,
  };
}
