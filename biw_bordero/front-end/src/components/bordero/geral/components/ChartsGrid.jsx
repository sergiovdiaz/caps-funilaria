// components/ChartsGrid.jsx
import React from "react";
import AggregationChart from "../../../cap/AggregationChart";
import { TendenciaChart } from "./TendenciaChart";

export const ChartsGrid = ({
  tipoMaquinaData,
  topMaquinasData,
  tendenciaData,
  filters,
  loading,
  onChartSelect,
  onDrillSemana,
  onVoltarSemana,
}) => {
  return (
    <div className="grid-3">
      {/* TOP ESTAÇÕES */}
      <div className={`chart-wrapper ${loading ? "loading" : ""}`}>
        <AggregationChart
          data={tipoMaquinaData}
          field="linestation"
          title="Top Estações"
          metric="loss_min"
          onSelect={onChartSelect}
          activeFilter={filters.linestation}
          orientation="vertical"
          labelPosition="outside"
          limit={10}
          groupOthers={false}
          height={150}
        />
      </div>

      {/* TOP MÁQUINAS */}
      <div className={`chart-wrapper ${loading ? "loading" : ""}`}>
        <AggregationChart
          data={topMaquinasData}
          field="maquina"
          title="Top Máquinas"
          metric="loss_min"
          onSelect={onChartSelect}
          activeFilter={filters.maquina}
          orientation="vertical"
          labelPosition="outside"
          limit={10}
          groupOthers={false}
          height={150}
        />
      </div>

      {/* TENDÊNCIA */}
      <TendenciaChart
        data={tendenciaData}
        nivel={filters.nivel}
        loading={loading}
        onDrillSemana={onDrillSemana}
        onVoltarSemana={onVoltarSemana}
      />
    </div>
  );
};
