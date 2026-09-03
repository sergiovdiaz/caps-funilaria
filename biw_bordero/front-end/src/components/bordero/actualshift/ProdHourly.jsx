import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import "./styles/ProdHourly.css";

const ProdHourly = ({ data = [] }) => {
  /**
   * Esperado:
   * data = [
   *   { hour: "08:00", value: 120 },
   *   { hour: "09:00", value: 135 },
   * ]
   */

  const series = [
    {
      name: "Produção",
      data: data.map((d) => d.value),
    },
  ];

  const options = useMemo(
    () => ({
      chart: {
        type: "bar",
        height: 300,
        toolbar: { show: false },
        fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif",
      },
      colors: ["#243782"], // 🔵 cor padrão do sistema
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "55%",
          dataLabels: {
            position: "top", // Posição específica para as barras
          }, // Posição específica para as barras
        },
      },
      dataLabels: {
        enabled: true,
        offsetY: -20,
        style: {
          fontSize: "12px",
          fontWeight: 600,
          colors: ["#334155"],
        },
      },
      xaxis: {
        categories: data.map((d) => {
          let date = new Date(d.hour);
          return date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        }),
        labels: {
          style: {
            colors: "#64748b",
            fontSize: "12px",
          },
        },
      },
      yaxis: {
        max: 62,
        min: 0,
        labels: {
          show: false,
          // style: {
          //   colors: "#64748b",
          //   fontSize: "12px",
          // },
        },
      },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
      },
      tooltip: {
        theme: "light",
      },
      title: {
        text: "Hora a Hora Produtivo",
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

export default ProdHourly;
