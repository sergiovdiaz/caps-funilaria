
//manusis.router.js

import * as machineledger from "./handlers/machineledger.handler.js";

export const manusisRouter = {
  machineledger,
};

//  export direto do usecase
export const manusisMachineledger = machineledger;


// export async function createReserva(reservaData) {
//   return manusisRequest("POST", "/api/v1/reservas", reservaData);
// }

// export async function searchMachines(query, params = {}) {
//   const url = `/api/v1/machines/search?q=${encodeURIComponent(query)}`;
//   return manusisRequest("GET", url, null, { params });
// }

// // exemplo de função para criar várias reservas de uma vez
// export async function  bulkReserva(reservas) {
//   const results = [];
//   for (const r of reservas) {
//     try {
//       const resp = await this.createReserva(r);
//       results.push({ success: true, resp });
//     } catch (err) {
//       results.push({ success: false, error: err.message });
//     }
//   }
//   return results;
// }

// export async function  testUserSpotlights() {
//   try {
//     const url =
//       "/api/v1/user_spotlights?_dc=1773773567321&page=1&start=0&limit=1000";
//     const data = await manusisRequest("GET", url);
//     console.log("✅ Resultado:", data);
//   } catch (err) {
//     console.error(
//       "❌ Erro ao buscar user_spotlights:",
//       err.response?.data || err.message,
//     );
//   }
// }

