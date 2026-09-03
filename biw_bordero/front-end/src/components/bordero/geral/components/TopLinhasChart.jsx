// components/TopLinhasChart.jsx
import React from "react";
import Chart from "react-apexcharts";
import { formatMinutesToHHMMSS } from "../../../cap/utils/capUtils";
import { BASE_CHART_OPTIONS, LABEL_STYLE } from "../utils/constants.js";

export const TopLinhasChart = ({ data, onSelectLinha, loading }) => {
  const chartConfig = {
    series: [
      { name: "Microparadas", data: data.map((d) => Number(d.micro)) },
      { name: "Quebras", data: data.map((d) => Number(d.quebra)) },
    ],
    options: {
      ...BASE_CHART_OPTIONS,
      chart: {
        ...BASE_CHART_OPTIONS.chart,
        stacked: true,
        events: {
          dataPointSelection: (_, __, config) => {
            const line = data[config.dataPointIndex].line;
            onSelectLinha(line);
          },
        },
      },
      colors: ["#243782", "#0284c7"],
      xaxis: {
        categories: data.map((d) => d.line),
        labels: { style: LABEL_STYLE },
        axisBorder: { color: "var(--border-light)" },
        axisTicks: { color: "var(--border-light)" },
      },
      yaxis: { show: false },
      dataLabels: {
        ...BASE_CHART_OPTIONS.dataLabels,
        formatter: (val) => formatMinutesToHHMMSS(val),
        total: {
          enabled: true,
          formatter: (val, opts) => {
            const index = opts.dataPointIndex;
            const total = data[index]?.total_loss;
            return formatMinutesToHHMMSS(total ?? val);
          },
          style: {
            fontSize: "var(--font-xxs)",
            fontFamily: "var(--font-family)",
            fontWeight: 700,
            color: "var(--text-secondary)",
          },
        },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "center",
        labels: { colors: "var(--text-secondary)" },
      },
      tooltip: {
        ...BASE_CHART_OPTIONS.tooltip,
        y: { formatter: (val) => formatMinutesToHHMMSS(val) },
      },
    },
  };

  return (
    <div className="card" style={{ marginBottom: "var(--spacing-sm)" }}>
      <h2>Top Linhas</h2>
      <div className={`chart-wrapper ${loading ? "loading" : ""}`}>
        <Chart {...chartConfig} type="bar" height={150} />
        {loading && <div className="chart-overlay" />}
      </div>
    </div>
  );
};
