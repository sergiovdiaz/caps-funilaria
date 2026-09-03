import React from "react";
import Chart from "react-apexcharts";

const BarChart = ({ series, categories, title }) => {
  const options = {
    chart: {
      type: "bar",
    },
    xaxis: {
      categories: categories,
    },
    title: {
      text: title || "Gráfico de Barras",
      align: "center",
      style: {
        fontSize: "20px", // ← tamanho da fonte
        fontFamily: "Arial", // ← tipo da fonte (pode ser qualquer fonte CSS)
        fontWeight: "bold", // ← peso da fonte
        color: "#243782", // ← cor do texto (opcional)
      },
    },
    colors: ["#243782"],
  };

  return (
    <div className="w-full">
      <Chart
        options={options}
        series={series}
        type="bar"
        height={350}
        width={1000}
      />
    </div>
  );
};

export default BarChart;
