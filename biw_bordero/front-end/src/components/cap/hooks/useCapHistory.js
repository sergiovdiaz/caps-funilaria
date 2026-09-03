//useCapHistory.js
import { useState, useCallback } from "react";
import { getCapHistory } from "../../../../api/cap.http";

export function useCapHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCapHistory({ startDate, endDate });
      // console.log("resposta: ", response);

      setData(response);
    } catch (err) {
      console.error("Erro ao buscar histórico CAP:", err);
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchHistory,
  };
}
