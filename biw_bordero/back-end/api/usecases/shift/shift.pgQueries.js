export const pgQueries = {
  getCurrentShift: `
    SELECT 
      shift_number,
      start_ts,
      end_ts,
      duration_hours,
      production_target
    FROM public.get_current_shift()
  `,

  getLineTcTarget: `
    SELECT 
      line,
      tc_target
    FROM tc.dim_line
    WHERE line = $1
  `,

  getShiftRules: `
    SELECT
      shift_number,
      start_time,
      end_time,
      duration_hours,
      production_target,
      duration_total,
      tc,
      is_monday_special
    FROM public.dim_shift
    ORDER BY shift_number
  `,

  getCurrentShiftProduction: `
  WITH shift AS (
    SELECT start_ts, end_ts
    FROM public.get_current_shift()
  )

  SELECT COUNT(DISTINCT p."Nseq") AS count
  FROM public.production_raw p
  CROSS JOIN shift s
  WHERE 
    to_timestamp(p._timestamp / 1000) >= s.start_ts
    AND to_timestamp(p._timestamp / 1000) < s.end_ts
    AND p."Line" = $1
`,
};
