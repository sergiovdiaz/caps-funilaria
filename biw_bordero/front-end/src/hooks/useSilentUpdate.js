import { useEffect, useRef } from "react";

export default function useSilentUpdate() {
  const currentVersion = useRef(null);
  const updateDetected = useRef(false);
  const inactivityTimeout = useRef(null);

  useEffect(() => {
    console.log("[SilentUpdate] Hook iniciado");

    const startInactivityTimer = () => {
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }

      inactivityTimeout.current = setTimeout(() => {
        console.log("[SilentUpdate] ✅ 2 min sem atividade. Atualizando...");
        window.location.reload();
      }, 120000);
    };

    const handleActivity = () => {
      if (!updateDetected.current) return;

      console.log("[SilentUpdate] 🔄 Atividade detectada, resetando timer");
      startInactivityTimer();
    };

    const addActivityListeners = () => {
      window.addEventListener("mousemove", handleActivity);
      window.addEventListener("click", handleActivity);
      window.addEventListener("keydown", handleActivity);
      window.addEventListener("touchstart", handleActivity);
    };

    const removeActivityListeners = () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };

    // 🔹 Buscar versão inicial
    fetch("/version.json")
      .then((res) => {
        if (!res.ok) throw new Error("version.json não encontrado");
        return res.json();
      })
      .then((data) => {
        if (data?.version) {
          currentVersion.current = data.version;
          console.log("[SilentUpdate] Versão inicial:", currentVersion.current);
        }
      })
      .catch((err) => {
        console.warn(
          "[SilentUpdate] Não foi possível obter versão:",
          err.message,
        );
      });

    // 🔹 Verificação a cada 60s
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/version.json?t=" + Date.now());

        if (!res.ok) return;

        const data = await res.json();
        if (!data?.version) return;

        if (currentVersion.current && data.version !== currentVersion.current) {
          if (!updateDetected.current) {
            console.log("[SilentUpdate] 🚨 Nova versão detectada!");
            updateDetected.current = true;

            // Atualiza referência para evitar loop
            currentVersion.current = data.version;

            addActivityListeners();
            startInactivityTimer();
          }
        }
      } catch (err) {
        console.error("[SilentUpdate] Erro ao verificar versão:", err);
      }
    }, 60000);

    return () => {
      clearInterval(interval);

      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }

      removeActivityListeners();
    };
  }, []);
}
