// //machineledger.pgService.js
// import { pool } from "../../postgreConnect.js";
// import { mapRow, buildMachineTree } from "./machineledger.mapper.js";
// import { pgQueries } from "./machineledger.pgQueries.js";

// // UTE
// export async function getUtes() {
//   const { rows } = await pool.query(pgQueries.selectUtes);
//   return rows.map(mapRow);
// }

// // LINHAS
// export async function getLinhas(ute) {
//   const { rows } = await pool.query(pgQueries.selectLinhas, [ute]);
//   return rows.map(mapRow);
// }

// // OPERAÇÕES
// export async function getOperacoes(linha) {
//   const { rows } = await pool.query(pgQueries.selectOperacoes, [linha]);
//   console.log(rows);
//   return rows.map(mapRow);
// }

// // TIPOS
// export async function getTipos(linha, operacao) {
//   const { rows } = await pool.query(pgQueries.selectTipos, [linha, operacao]);
//   return rows.map(mapRow);
// }

// // MÁQUINAS
// export async function getMaquinas(linha, operacao, tipoMaquina) {
//   const { rows } = await pool.query(pgQueries.selectMaquinas, [
//     linha,
//     operacao,
//     tipoMaquina,
//   ]);
//   return rows.map(mapRow);
// }

// // COMPONENTES
// export async function getComponentesByMaquina(maquina) {
//   const { rows } = await pool.query(pgQueries.selectComponentes, [maquina]);
//   return rows;
// }

// // FULL TREE
// export async function getFullTree() {
//   const { rows } = await pool.query(pgQueries.selectTreeBase);
//   return buildMachineTree(rows);
// }
