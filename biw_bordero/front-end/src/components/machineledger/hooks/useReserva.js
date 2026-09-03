import { useState, useCallback, useRef, useEffect } from "react";
import {
  createReserva,
  getReservaStatus,
  monitorReservaStatus,
} from "../../../../api/machineledger.http";

const STORAGE_KEY = "ultima_reserva_v1";

export const useReserva = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reserva, setReserva] = useState(null);
  const [status, setStatus] = useState(null);
  const [monitoringActive, setMonitoringActive] = useState(false);

  // 🔥 já carrega do localStorage
  const [numeroReservaPrincipal, setNumeroReservaPrincipal] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const stopMonitoringRef = useRef(null);

  // 🧹 limpar monitoramento ao desmontar
  useEffect(() => {
    return () => {
      if (stopMonitoringRef.current) {
        stopMonitoringRef.current();
      }
    };
  }, []);

  // 💾 salva automaticamente no localStorage
  useEffect(() => {
    try {
      if (numeroReservaPrincipal) {
        localStorage.setItem(STORAGE_KEY, numeroReservaPrincipal);
      }
    } catch (err) {
      console.error("Erro ao salvar reserva:", err);
    }
  }, [numeroReservaPrincipal]);

  const criarReserva = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setReserva(null);
    setStatus(null);

    // ⚠️ NÃO limpa aqui, pra manter última reserva visível até nova chegar
    // setNumeroReservaPrincipal(null);

    if (stopMonitoringRef.current) {
      stopMonitoringRef.current();
      stopMonitoringRef.current = null;
    }

    try {
      const response = await createReserva(params);

      if (response.success && response.data) {
        setReserva(response.data);

        // 🔥 salva nova reserva
        if (response.data.numeroReservaPrincipal) {
          setNumeroReservaPrincipal(response.data.numeroReservaPrincipal);
        }

        if (response.data.monitoramentoAtivo && response.data.transactionId) {
          const stop = startMonitoring(response.data.transactionId);
          stopMonitoringRef.current = stop;
        }

        return response.data;
      }

      throw new Error(response.message || "Erro ao criar reserva");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const consultarStatus = useCallback(async (id, orderId) => {
    try {
      const response = await getReservaStatus(id, { orderId });

      if (response.success && response.data) {
        setStatus(response.data);
        return response.data;
      }

      return null;
    } catch (err) {
      console.error("Erro ao consultar status:", err);
      return null;
    }
  }, []);

  const startMonitoring = useCallback((id, options = {}) => {
    setMonitoringActive(true);

    const monitor = monitorReservaStatus(id, {
      interval: 3000,
      maxAttempts: 20,
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onComplete: (finalStatus) => {
        setStatus(finalStatus);
        setMonitoringActive(false);
      },
      onError: (err) => {
        console.error("Erro no monitoramento:", err);
        setError(err.message);
        setMonitoringActive(false);
      },
      ...options,
    });

    monitor.start();

    return monitor.stop;
  }, []);

  const pararMonitoramento = useCallback(() => {
    if (stopMonitoringRef.current) {
      stopMonitoringRef.current();
      stopMonitoringRef.current = null;
    }
    setMonitoringActive(false);
  }, []);

  const reset = useCallback(() => {
    if (stopMonitoringRef.current) {
      stopMonitoringRef.current();
      stopMonitoringRef.current = null;
    }

    setLoading(false);
    setError(null);
    setReserva(null);
    setStatus(null);

    // 🔥 aqui você decide:
    // 👉 manter última reserva (recomendado)
    // NÃO limpar localStorage

    // 👉 se quiser limpar tudo, use:
    // localStorage.removeItem(STORAGE_KEY);
    // setNumeroReservaPrincipal(null);

    setMonitoringActive(false);
  }, []);

  return {
    // Estados
    loading,
    error,
    reserva,
    status,
    monitoringActive,
    numeroReservaPrincipal,

    // Funções
    criarReserva,
    consultarStatus,
    startMonitoring,
    pararMonitoramento,
    reset,
  };
};
