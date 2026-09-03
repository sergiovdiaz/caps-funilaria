import { useState, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  approveJustificativa,
  requestChangesJustificativa,
} from "../../../../api/cap.http";

export function useCapAction() {
  const { getValidToken } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approve = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);

        const token = await getValidToken();

        const response = await approveJustificativa(id, token);

        // ✅ SUCESSO
        showToast("Justificativa aprovada com sucesso ✅", "success");

        return response;
      } catch (err) {
        const message =
          err?.response?.data?.error || err?.message || "Erro ao aprovar";

        setError(message);

        // ❌ ERRO
        showToast(message, "error");

        return {
          error: true,
          message,
          status: err?.response?.status,
        };
      } finally {
        setLoading(false);
      }
    },
    [getValidToken, showToast],
  );

  const requestChanges = useCallback(
    async (id, payload) => {
      try {
        setLoading(true);
        setError(null);

        const token = await getValidToken();

        const response = await requestChangesJustificativa(id, payload, token);

        // ✅ SUCESSO
        showToast("Alteração solicitada com sucesso ✏️", "info");

        return response;
      } catch (err) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Erro ao solicitar alteração";

        setError(message);

        // ❌ ERRO
        showToast(message, "error");

        return {
          error: true,
          message,
          status: err?.response?.status,
        };
      } finally {
        setLoading(false);
      }
    },
    [getValidToken, showToast],
  );

  return {
    approve,
    requestChanges,
    loading,
    error,
  };
}
