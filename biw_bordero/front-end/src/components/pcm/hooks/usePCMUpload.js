// /pages/pcm/hooks/usePCMUpload.js

import { useState, useCallback, useRef } from "react";
import { uploadPCM } from "../../../../api/pcm.http.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";

export function usePCMUpload() {
  const { getValidToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const abortControllerRef = useRef(null);

  const abort = () => {
    abortControllerRef.current?.abort();
  };

  const sendFile = useCallback(
    async (file, ano, semana, overwrite) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);

        const token = await getValidToken();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("ano", ano);
        formData.append("semana", semana);
        formData.append("overwrite", overwrite);

        // cria novo controller para cada upload
        abortControllerRef.current = new AbortController();

        const result = await uploadPCM(formData, token, {
          signal: abortControllerRef.current.signal,
        });

        // Trata semana divergente ou conflito
        if (result?.type === "week_mismatch" || result?.conflict) {
          return result;
        }

        // Trata caso sem dados
        if (result?.type === "no_data") {
          setError(result.message);
          return result;
        }

        // Se deu certo
        if (result?.success) {
          setSuccess(true);
        }

        return result;
      } catch (err) {
        if (err.name === "AbortError") return null;

        setError(err.message || "Erro inesperado");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getValidToken],
  );

  return {
    loading,
    error,
    success,
    sendFile,
    abort,
  };
}
