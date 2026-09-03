//linestatus.pgService.js
import { pool } from "../../postgreConnect.js";
import { pgQueries } from "./linestatus.pgQueries.js";

export async function loadLinestatusRulesFromDB() {
  const { rows } = await pool.query(pgQueries.getLinestatusRules);
  return rows;
}

export async function loadLinestatusStationsFromDB() {
  const { rows } = await pool.query(pgQueries.getLineST);
  return rows;
}
