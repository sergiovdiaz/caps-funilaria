import React, { useMemo } from "react";
import Chart from "react-apexcharts";

const ProdLosses = ({ data = [] }) => {
  /**
   * Esperado:
   * data = [
   *   { label: "Setup", seconds: 90 },
   *   { label: "Falta Material", seconds: 320 },
   *   { label: "Manutenção", seconds: 180 },
   * ]
   */

  // converte segundos → mm:ss
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const series = [
    {
      name: "Tempo de Perda",
      data: data.map((d) => d.seconds),
    },
  ];

  const options = useMemo(
    () => ({
      chart: {
        type: "bar",
        height: 320,
        toolbar: { show: false },
        fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif",
      },

      colors: [
        "#243782",
        "#0284c7",
        "#16a34a",
        "#d97706",
        "#dc2626",
        "#7c3aed",
      ],

      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 6,
          columnWidth: "55%",
          distributed: true,
          dataLabels: {
            position: "top", // Posição específica para as barras
          },
        },
      },

      dataLabels: {
        enabled: true,
        offsetY: -20,
        formatter: (val) => {
          const m = Math.floor(val / 60);
          const s = Math.floor(val % 60);
          return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        },
        style: {
          fontSize: "12px",
          fontWeight: 600,
          colors: ["#334155"],
        },
      },

      xaxis: {
        categories: data.map((d) => d.label),
        labels: {
          style: {
            colors: "#64748b",
            fontSize: "12px",
          },
        },
      },

      yaxis: {
        labels: {
          show: false,
        },
      },

      tooltip: {
        y: {
          formatter: (val) => formatDuration(val),
          title: {
            formatter: () => "Duração",
          },
        },
      },

      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
      },
      legend: {
        show: false,
      },

      title: {
        text: "Perdas por Causal",
        align: "left",
        style: {
          color: "#243782",
          fontSize: "16px",
          fontWeight: 700,
        },
      },
    }),
    [data]
  );

  return (
    <div className="andon-prod">
      <Chart
        options={options}
        series={series}
        type="bar"
        height={300}
        width="100%"
      />
    </div>
  );
};

export default ProdLosses;
