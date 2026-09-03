import { pool } from "../../postgreConnect.js";

export async function getStatusMedicao() {
  const query = `
  SELECT 
    line_name, 
    timer_name,
    value, 
    status_since,
    last_seen_at
  FROM weld.measure_type_status
  `;
  const { rows } = await pool.query(query);

  return rows;
}
