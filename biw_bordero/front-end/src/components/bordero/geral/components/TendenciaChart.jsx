// components/TendenciaChart.jsx
import React from "react";
import Chart from "react-apexcharts";
import { formatMinutesToHHMMSS } from "../../../cap/utils/capUtils";
import { BASE_CHART_OPTIONS, LABEL_STYLE } from "../utils/constants.js";

export const TendenciaChart = ({
  data,
  nivel,
  loading,
  onDrillSemana,
  onVoltarSemana,
}) => {
  const chartConfig = {
    series: [
      {
        name: "Loss",
        data: data.map((d) => Number(d.loss_min)),
      },
    ],
    options: {
      ...BASE_CHART_OPTIONS,
      chart: {
        ...BASE_CHART_OPTIONS.chart,
        type: "line",
        events: {
          dataPointSelection: (_, __, config) => {
            const periodo = data[config.dataPointIndex].periodo;
            if (nivel === "semana") {
              onDrillSemana(periodo);
            }
          },
        },
      },
      colors: ["#243782"],
      stroke: {
        curve: "smooth",
        width: 3,
      },
      markers: {
        size: 4,
      },
      xaxis: {
        categories: data.map((d) => d.periodo),
        labels: { style: LABEL_STYLE },
      },
      yaxis: { show: false },
      dataLabels: {
        ...BASE_CHART_OPTIONS.dataLabels,
        formatter: (val) => formatMinutesToHHMMSS(val),
        style: {
          ...BASE_CHART_OPTIONS.dataLabels.style,
          colors: ["#243782"],
        },
      },
      tooltip: {
        ...BASE_CHART_OPTIONS.tooltip,
        y: {
          formatter: (val) => formatMinutesToHHMMSS(val),
        },
      },
    },
  };

  return (
    <div className="card">
      <h2>Tendência ({nivel === "semana" ? "Semana" : "Dia"})</h2>

      {nivel === "dia" && (
        <button onClick={onVoltarSemana} className="back-button">
          ← Voltar para Semana
        </button>
      )}

      <div className={`chart-wrapper ${loading ? "loading" : ""}`}>
        <Chart {...chartConfig} type="line" height={150} />
        {loading && <div className="chart-overlay" />}
      </div>
    </div>
  );
};
