import { useEffect, useState } from "react";
import { getTcHistory } from "../../../../api/tc.http";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toLocalDateTimeString(date) {
  // YYYY-MM-DD HH:mm:ss
  const pad = (n) => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}`
  );
}

export function useTcHistory({ line, startDate, endDate, st, maq }) {
  const [history, setHistory] = useState([]);
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!line || !startDate || !endDate) return;

    setLoading(true);
    setError(null);

    const normalizedStart = startOfDay(startDate);
    const normalizedEnd = endOfDay(endDate);

    getTcHistory({
      line,
      startDate: toLocalDateTimeString(normalizedStart),
      endDate: toLocalDateTimeString(normalizedEnd),
      st,
      maq,
    })
      .then((res) => {
        // console.log("getTcHistory response:", res);
        const payload = res.data ?? res;

        setHistory(payload.history ?? []);
        setTarget(payload.target ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [line, startDate, endDate, st, maq]);

  return {
    history,
    target,
    loading,
    error,
  };
}
