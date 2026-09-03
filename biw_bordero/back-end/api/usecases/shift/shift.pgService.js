import { pool } from "../../postgreConnect.js";
import { pgQueries } from "./shift.pgQueries.js";

export async function getCurrentShiftFromDB() {
  const { rows } = await pool.query(pgQueries.getCurrentShift);
  return rows[0] || null;
}

export async function getLineTcTarget(line) {
  const { rows } = await pool.query(pgQueries.getLineTcTarget, [line]);

  return rows[0] || null;
}

let shiftRulesCache = [];

export async function loadShiftRules() {
  const { rows } = await pool.query(pgQueries.getShiftRules);
  shiftRulesCache = rows;
  return shiftRulesCache;
}

export function getShiftRules() {
  return shiftRulesCache;
}

export async function getCurrentShiftProduction(line) {
  const { rows } = await pool.query(pgQueries.getCurrentShiftProduction, [
    line,
  ]);

  return rows[0]?.count || 0;
}
