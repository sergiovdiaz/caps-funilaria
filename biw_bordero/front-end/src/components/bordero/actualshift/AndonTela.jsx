import React, { useState, useEffect } from "react";
import "./styles/AndonTela.css";
import { SkeletonBox, SkeletonLine } from "../../skeleton/Skeleton";
const AndonTela = ({ line, data }) => {
  // Inicializa com os dados reais ou vazio se não tiver
  const [andonData, setAndonData] = useState(() => {
    if (!data) return null;
    console.log("Dados iniciais do Andon:", data);

    return {
      imposta: data.impostada,
      teorica: data.teorica,
      realizado: data.realizado,
      delta: data.delta,
      eficiencia: (data.eficiencia * 100).toFixed(1), // de 0-1 para %
      progresso: data.impostada ? (data.realizado / data.impostada) * 100 : 0,
      linha: line || "--",
      statusAtual: {
        status: data.status ?? "--",
        color_hex: data.color_hex,
        estacao: data.estacao ?? "--",
        maquina: data.maquina ?? "--",
        componente: data.componente ?? "--",
        descricao: data.alarm ?? "--",
        timestampInicio: data.inicio ? new Date(data.inicio) : null,
        duracao: data.inicio
          ? Math.floor((Date.now() - new Date(data.inicio)) / 1000)
          : 0,
      },
    };
  });

  // Atualiza quando prop data mudar
  useEffect(() => {
    if (!data) {
      setAndonData(null); // sem dados
      return;
    }

    setAndonData({
      imposta: data.impostada,
      teorica: data.teorica,
      realizado: data.realizado,
      delta: data.delta,
      eficiencia: (data.eficiencia * 100).toFixed(1),
      progresso: data.impostada ? (data.realizado / data.impostada) * 100 : 0,

      linha: line || "SCC",
      statusAtual: {
        status: data.status ?? "--",
        color_hex: data.color_hex,
        estacao: data.estacao ?? "--",
        maquina: data.maquina ?? "--",
        componente: data.componente ?? "--",
        descricao: data.alarm ?? "--",
        timestampInicio: data.inicio ? new Date(data.inicio) : null,
        duracao: data.inicio
          ? Math.floor((Date.now() - new Date(data.inicio)) / 1000)
          : 0,
      },
    });
  }, [data, line]);

  // Atualiza duração em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setAndonData((prev) => {
        if (!prev?.statusAtual?.timestampInicio) return prev;
        return {
          ...prev,
          statusAtual: {
            ...prev.statusAtual,
            duracao: Math.floor(
              (Date.now() - new Date(prev.statusAtual.timestampInicio)) / 1000
            ),
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!andonData) {
    return (
      <div className="andon-container">
        {/* Header linha */}
        <SkeletonLine width="120px" />
        <SkeletonLine width="80px" />

        {/* Métricas */}
        <div className="andon-metrics">
          {[...Array(5)].map((_, i) => (
            <SkeletonBox key={i} height={64} />
          ))}
        </div>

        {/* Status card */}
        <SkeletonBox height={280} />

        {/* Progresso */}
        <SkeletonBox height={60} />
      </div>
    );
  }

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const formatTimestamp = (date) =>
    date
      ? date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "--";

  return (
    <div className="andon-container">
      {/* ===== HEADER LINHA ===== */}
      <div className="andon-line-header">
        <span className="andon-line-label">LINHA</span>
        <span className="andon-line-value">{andonData.linha}</span>
      </div>

      {/* ===== MÉTRICAS ===== */}
      <div className="andon-metrics">
        <Metric title="Impostada" value={andonData.imposta} color="blue" />
        <Metric title="Teórica" value={andonData.teorica} color="purple" />
        <Metric title="Realizado" value={andonData.realizado} color="green" />
        <Metric
          title="Delta"
          value={andonData.delta}
          color={andonData.delta < 0 ? "red" : "green"}
          prefix={andonData.delta > 0 ? "+" : ""}
        />
        <Metric
          title="Eficiência"
          value={`${andonData.eficiencia}%`}
          color="cyan"
        />
      </div>

      {/* ===== STATUS ===== */}
      <div className="andon-status-card">
        <div
          className="andon-status-header"
          style={{
            background: `${andonData.statusAtual.color_hex}45`, // adicionando transparência (33 = 20% opacity em hex)
            borderBottom: `2px solid ${andonData.statusAtual.color_hex}`,
          }}
        >
          <div className="status-left">
            <span
              className="pulse-dot"
              style={{
                background: andonData.statusAtual.color_hex,
                "--status-color": andonData.statusAtual.color_hex,
              }}
            />
            <span className="status-title">{andonData.statusAtual.status}</span>
          </div>

          <div className="status-times">
            <div>
              <small>Início</small>
              <strong>
                {formatTimestamp(andonData.statusAtual.timestampInicio)}
              </strong>
            </div>
            <div>
              <small>Duração</small>
              <strong>{formatDuration(andonData.statusAtual.duracao)}</strong>
            </div>
          </div>
        </div>

        <div className="andon-status-body">
          <div className="status-info">
            <label>Estação</label>
            <span>{andonData.statusAtual.estacao}</span>

            <label>Máquina</label>
            <span>{andonData.statusAtual.maquina}</span>

            <label>Componente</label>
            <span className="highlight">
              {andonData.statusAtual.componente}
            </span>
          </div>

          <div className="status-description">
            <label>Descrição</label>
            <p>{andonData.statusAtual.descricao}</p>
          </div>
        </div>
      </div>

      {/* ===== PROGRESSO ===== */}
      <div className="andon-progress">
        <div className="progress-header">
          <span>Progresso da Meta</span>
          <span>
            {andonData.realizado} / {andonData.imposta}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(andonData.progresso, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const Metric = ({ title, value, color, prefix = "" }) => (
  <div className={`metric-card border-${color}`}>
    <span className="metric-title">{title}</span>
    <strong className="metric-value">
      {prefix}
      {value}
    </strong>
  </div>
);

export default AndonTela;
