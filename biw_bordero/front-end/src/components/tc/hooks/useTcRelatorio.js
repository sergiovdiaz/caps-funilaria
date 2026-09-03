//useTcRelatorio.js

import { useEffect, useState, useCallback } from "react";
import { getTcRelatorio } from "../../../../api/tc.http";

export function useTcRelatorio() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRelatorio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getTcRelatorio();

      // ajusta conforme seu successResponse
      const result = res.data ?? res;

      setData(result);
    } catch (err) {
      console.error("Erro ao buscar relatório TC:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelatorio();
  }, [fetchRelatorio]);

  return {
    data,
    loading,
    error,
    refetch: fetchRelatorio,
  };
}
