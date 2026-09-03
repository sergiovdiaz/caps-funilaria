import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import { getTopLossData, secondsToHHMMSS } from "./utils/utils";

const ClusterChart = ({ events, setFilters, filters }) => {
  const chartData = useMemo(
    () => getTopLossData(events, "tipo_maquina"),
    [events],
  );

  // 🎨 cores dinâmicas conforme filtro ativo
  const barColors = useMemo(() => {
    return chartData.map((d) => {
      if (filters.cluster) {
        return d.label === filters.cluster ? "#1e2d64" : "#cbd5e1"; // filtro ativo: azul escuro
      }
      return "#243782"; // padrão azul
    });
  }, [chartData, filters.cluster]);

  const options = useMemo(() => {
    return {
      chart: {
        type: "bar",
        fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif",
        events: {
          dataPointSelection: (_, __, config) => {
            const idx = config.dataPointIndex;
            if (!chartData[idx]) return;

            const cluster = chartData[idx].label;
            setFilters((prev) => ({
              ...prev,
              cluster: prev.cluster === cluster ? null : cluster,
            }));
          },
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "55%",
          dataLabels: {
            position: "top", // label acima da barra
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => secondsToHHMMSS(val), // transforma em HH:MM:SS
        offsetY: -20, // posiciona acima da barra
        style: {
          fontSize: "12px",
          fontWeight: 600,
          colors: ["#334155"], // cor do label
        },
      },
      xaxis: {
        categories: chartData.map((d) => d.label),
        labels: {
          formatter: (val) =>
            val.length > 10 ? val.substring(0, 10) + "…" : val,
          rotate: -45,
          style: { fontSize: "12px", colors: "#64748b" },
        },
      },
      yaxis: {
        show: false,
      },
      grid: {
        borderColor: "var(--border-light)",
        strokeDashArray: 4,
        padding: { top: 0, right: 8, bottom: 0, left: 8 },
      },
      colors: barColors, // cores dinâmicas
      tooltip: {
        shared: false,
        x: {
          formatter: (_, { dataPointIndex }) =>
            chartData[dataPointIndex]?.label,
        },
        y: {
          formatter: (val) => secondsToHHMMSS(val), // tooltip também HH:MM:SS
        },
      },
    };
  }, [chartData, barColors, setFilters]);

  return (
    <Chart
      key={filters.cluster ?? "no-cluster-filter"} // força reset visual
      options={options}
      series={[{ name: "Duração", data: chartData.map((d) => d.value) }]}
      type="bar"
      height={230}
    />
  );
};

export default ClusterChart;
