import { useEffect, useState, useMemo } from "react";

function formatDuration(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

export default function LineStatusCard({ data }) {
  const [duration, setDuration] = useState("00:00:00");

  // 🔹 Fallback seguro
  const lineData = data?.line ?? {};

  const {
    andondesc,
    color_hex,
    alarm,
    timestamp,
    station,
    element,
    component,
  } = lineData;

  // 🔹 Calcula data inicial
  const startDate = useMemo(() => {
    if (!timestamp) return null;
    return new Date(timestamp);
  }, [timestamp]);

  // 🔹 Atualiza duração
  useEffect(() => {
    if (!startDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diffSeconds = Math.floor((now - startDate) / 1000);
      setDuration(formatDuration(diffSeconds));
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  const startTime = startDate
    ? startDate.toLocaleTimeString("pt-BR", { hour12: false })
    : "--:--:--";

  // 🔹 Agora pode proteger render
  if (!data?.line) return null;

  return (
    <div
      className="linestatus-card"
      style={{
        "--status-color": color_hex || "#ee1f23",
        "--status-glow": (color_hex || "#ee1f23") + "55",
      }}
    >
      <div className="linestatus-accent" />

      <div className="linestatus-body">
        <div className="linestatus-status-row">
          <div className="linestatus-title">{andondesc}</div>

          {/*  BLOCO INÍCIO + DURAÇÃO */}
          <div className="linestatus-time-block">
            <div>
              <span className="linestatus-meta-label">Início</span>
              <span className="linestatus-meta-value">{startTime}</span>
            </div>
            <div>
              <span className="linestatus-meta-label">Duração</span>
              <span className="linestatus-meta-value highlight">
                {duration}
              </span>
            </div>
          </div>
        </div>

        {alarm && (
          <div className="linestatus-alarm-row">
            <div className="linestatus-pulse-dot" />
            <span className="linestatus-alarm-text">{alarm}</span>
          </div>
        )}
      </div>

      <div className="linestatus-divider" />

      <div className="linestatus-footer">
        <div className="linestatus-meta-item">
          <span className="linestatus-meta-label">Estação</span>
          <span className="linestatus-meta-value">{station || "—"}</span>
        </div>

        <div className="linestatus-meta-item">
          <span className="linestatus-meta-label">Elemento</span>
          <span className="linestatus-meta-value">{element || "—"}</span>
        </div>

        <div className="linestatus-meta-item">
          <span className="linestatus-meta-label">Componente</span>
          <span className="linestatus-meta-value">{component || "—"}</span>
        </div>
      </div>
    </div>
  );
}
