import { pool } from "../../postgreConnect.js";

export async function buildActiveFaults(line) {
  const sql = `
    SELECT 
        a.id AS alarm_id,
        a.line,
        d.ute,
        d.type,
        a.station,
        a.element,
        a.component,
        a.alarm,
        a.start_time,
        a.dur_min,
        a.nivel AS nivel_atual,

        n.id AS notification_id,
        n.nivel AS notification_nivel,
        n.confirmed,
        n.confirmed_at,

        jsonb_agg(
          jsonb_build_object(
            'text', c.comment,
            'timestamp', c.created_at,
            'user',
            regexp_replace(u_comment.nome, '^(\\S+\\s+\\S+).*$', '\\1')
          )
        ) FILTER (WHERE c.id IS NOT NULL) AS comments

    FROM fms.vw_active_line_alarms a

    LEFT JOIN public.dim_line d
        ON a.line = d.line

    LEFT JOIN fms.alarm_notification n
        ON n.alarm_id = a.id
        AND n.nivel <= a.nivel

    LEFT JOIN fms.alarm_notification_comment c
        ON c.alarm_notification_id = n.id

    LEFT JOIN auth.usuarios u_comment
        ON u_comment.matricula = c.created_by

    WHERE d.ute = '1'

    GROUP BY
        a.id,
        a.line,
        d.ute,
        d.type,
        a.station,
        a.element,
        a.component,
        a.alarm,
        a.start_time,
        a.dur_min,
        a.nivel,
        n.id,
        n.nivel,
        n.confirmed,
        n.confirmed_at

    ORDER BY
        a.dur_min ASC,
        n.nivel ASC;
`;

  try {
    const { rows } = await pool.query(sql);

    // Monta a estrutura JS igual ao useState
    const faultsMap = {};

    for (const row of rows) {
      if (!faultsMap[row.alarm_id]) {
        // Cria objeto base do alarme
        faultsMap[row.alarm_id] = {
          id: row.alarm_id,
          line: row.line,
          station: row.station,
          element: row.element,
          component: row.component,
          alarm: row.alarm,
          start_time: row.start_time,
          duration_min: Number(row.dur_min),
          nivel: row.nivel_atual,
          notifications: {
            nivel1: { confirmed: false, comments: [], confirmedAt: null },
            nivel2: { confirmed: false, comments: [], confirmedAt: null },
            nivel3: { confirmed: false, comments: [], confirmedAt: null },
            nivel4: { confirmed: false, comments: [], confirmedAt: null },
            nivel5: { confirmed: false, comments: [], confirmedAt: null },
          },
        };
      }

      if (row.notification_nivel) {
        const nivelKey = `nivel${row.notification_nivel}`;
        faultsMap[row.alarm_id].notifications[nivelKey] = {
          confirmed: row.confirmed,
          comments: row.comments || [],
          confirmedAt: row.confirmed_at,
        };
      }
    }

    return Object.values(faultsMap).sort(
      (a, b) => a.duration_min - b.duration_min,
    );
  } catch (err) {
    console.error("Erro buildActiveFaults:", err);
    return [];
  }
}

export async function buildHistoryFaults(line) {
  const sql = `
  SELECT
      a.id AS alarm_id,
      a.line,
      d.ute,
      d.type,
      a.station,
      a.element,
      a.component,
      a.alarm,
      a.start_time,
      a.end_time,
      a.dur_min,
      a.nivel AS nivel_atual,

      n.id AS notification_id,
      n.nivel AS notification_nivel,
      n.confirmed,
      n.confirmed_at,

      jsonb_agg(
        jsonb_build_object(
          'text', c.comment,
          'timestamp', c.created_at,
          'user',
          regexp_replace(u_comment.nome, '^(\\S+\\s+\\S+).*$', '\\1')
        )
      ) FILTER (WHERE c.id IS NOT NULL) AS comments

  FROM fms.vw_faults_history a

  LEFT JOIN public.dim_line d
      ON a.line = d.line

  LEFT JOIN fms.alarm_notification n
      ON n.alarm_id = a.id
      AND n.nivel <= a.nivel

  LEFT JOIN fms.alarm_notification_comment c
      ON c.alarm_notification_id = n.id

  LEFT JOIN auth.usuarios u_comment
      ON u_comment.matricula = c.created_by

  WHERE d.ute = '1' AND  a.end_time IS NOT NULL

  GROUP BY
      a.id,
      a.line,
      d.ute,
      d.type,
      a.station,
      a.element,
      a.component,
      a.alarm,
      a.start_time,
      a.end_time,
      a.dur_min,
      a.nivel,
      n.id,
      n.nivel,
      n.confirmed,
      n.confirmed_at

  ORDER BY
      a.end_time DESC
  LIMIT 30;
`;

  try {
    const { rows } = await pool.query(sql);

    // Monta a estrutura JS igual ao useState
    const faultsMap = {};

    for (const row of rows) {
      if (!faultsMap[row.alarm_id]) {
        // Cria objeto base do alarme
        faultsMap[row.alarm_id] = {
          id: row.alarm_id,
          line: row.line,
          station: row.station,
          element: row.element,
          component: row.component,
          alarm: row.alarm,
          start_time: row.start_time,
          end_time: row.end_time,
          duration_min: Number(row.dur_min),
          nivel: row.nivel_atual,
          notifications: {
            nivel1: { confirmed: false, comments: [], confirmedAt: null },
            nivel2: { confirmed: false, comments: [], confirmedAt: null },
            nivel3: { confirmed: false, comments: [], confirmedAt: null },
            nivel4: { confirmed: false, comments: [], confirmedAt: null },
            nivel5: { confirmed: false, comments: [], confirmedAt: null },
          },
        };
      }

      if (row.notification_nivel) {
        const nivelKey = `nivel${row.notification_nivel}`;
        faultsMap[row.alarm_id].notifications[nivelKey] = {
          confirmed: row.confirmed,
          comments: row.comments || [],
          confirmedAt: row.confirmed_at,
        };
      }
    }

    return Object.values(faultsMap);
  } catch (err) {
    console.error("Erro buildActiveFaults:", err);
    return [];
  }
}
