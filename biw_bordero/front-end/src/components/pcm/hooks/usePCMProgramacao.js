import { useState, useCallback } from "react";
import { getPCMProgramacao } from "../../../../api/pcm.http.js";

export function usePCMProgramacao() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchProgramacao = useCallback(
    async (ano, semana, groupBy = "colaborador") => {
      try {
        setLoading(true);
        setError(null);

        const result = await getPCMProgramacao({ ano, semana, groupBy });
        // console.log(result);

        setData(result);
        return result;
      } catch (err) {
        setError(err.message || "Erro ao buscar programação");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    data,
    fetchProgramacao,
  };
}
