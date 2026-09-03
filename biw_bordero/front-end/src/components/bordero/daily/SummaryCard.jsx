import React from "react";

const SummaryCard = ({ title, data, onClick, active }) => {
  const getStatusClass = (value) =>
    value > 0 ? "positive" : value < 0 ? "negative" : "neutral";

  const formatValue = (value, suffix = "") =>
    value === null || value === undefined ? "-" : `${value}${suffix}`;

  return (
    <div
      className={`summary-card ${active ? "active-card" : ""}`} // adiciona classe
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div className="summary-header">
        <h3>{title}</h3>
        <span className="summary-badge">OPE: {data.ope}%</span>
      </div>
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Previsto</span>
          <strong className="summary-value">
            {formatValue(data.previsto)}
          </strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Realizado</span>
          <strong className="summary-value primary">
            {formatValue(data.realizado)}
          </strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Delta</span>
          <strong className={`summary-value ${getStatusClass(data.delta)}`}>
            {data.delta > 0 ? "+" : ""}
            {formatValue(data.delta)}
          </strong>
        </div>
        <div className="summary-item full">
          <span className="summary-label">JPH</span>
          <strong className="summary-value featured">
            {formatValue(data.jph)}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
