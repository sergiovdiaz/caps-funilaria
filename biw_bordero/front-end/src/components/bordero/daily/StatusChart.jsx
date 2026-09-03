import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import { secondsToHHMMSS } from "./utils/utils";
import { STATUS_COLORS } from "../../../assets/database/colors";

const StatusChart = ({ events = [], setFilters, filters }) => {
  const chartData = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Soma o losstime por status
    const losstimePerStatus = events.reduce((acc, e) => {
      if (!e.status) return acc;
      acc[e.status] = (acc[e.status] || 0) + (e.losstime || 0); // <- soma losstime
      return acc;
    }, {});

    const totalLosstime = Object.values(losstimePerStatus).reduce(
      (sum, v) => sum + v,
      0
    );
    let others = 0;

    const seriesData = Object.entries(losstimePerStatus)
      .map(([label, value]) => {
        if (value / totalLosstime > 0.04) {
          return {
            label,
            value,
            color: STATUS_COLORS[label] || STATUS_COLORS.default,
          };
        } else {
          others += value;
          return null;
        }
      })
      .filter(Boolean);

    if (others > 0) {
      seriesData.push({ label: "Outros", value: others, color: "#cbd5e1" });
    }

    return seriesData;
  }, [events]);

  // ADICIONE esta linha - chave única baseada nos eventos
  const chartKey = useMemo(() => {
    return `status-chart-${events.length}-${filters.status || "no-filter"}`;
  }, [events.length, filters.status]);

  if (chartData.length === 0) {
    return <p>Nenhum status disponível</p>;
  }

  const options = {
    chart: {
      type: "pie",
      fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif",
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const idx = config.dataPointIndex;
          if (!chartData[idx]) return;
          const status = chartData[idx].label;
          if (status && status !== "Outros") {
            setFilters((prev) => ({
              ...prev,
              status: prev.status === status ? null : status,
            }));
          }
        },
      },
    },
    labels: chartData.map((d) => d.label),
    colors: chartData.map((d) => d.color),
    legend: { show: true, position: "bottom" },
    tooltip: {
      y: {
        formatter: (val) => secondsToHHMMSS(val), // ← aqui, soma por status em HH:MM:SS
      },
    },
  };

  return (
    <Chart
      key={chartKey} // ← ADICIONE esta prop key
      options={options}
      series={chartData.map((d) => d.value)}
      type="pie"
      height={200}
    />
  );
};

export default StatusChart;
