import React from "react";
import Chart from "react-apexcharts";
import "./styles/savisionbarchart.css";

const SavisionBarChart = ({ turnos, categories, series, title }) => {
  const safeSeries =
    series?.length > 0 ? series : [{ name: "default", data: [] }];

  const options = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      fontFamily: "Segoe UI, sans-serif",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 4,
      },
    },
    xaxis: {
      categories: categories || [],
      labels: {
        rotate: 0, // horizontal
        show: true,
        trim: false, // não corta os textos
        hideOverlappingLabels: false, // força mostrar todos
        style: {
          colors: "#fff",
          fontSize: "12px",
          fontFamily: "Segoe UI",
        },
      },
      title: {
        text: title,
        style: {
          color: "#fff",
          fontWeight: "light",
        },
      },
    },
    yaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      yaxis: { lines: { show: false } },
    },
    legend: { show: false },
    fill: { opacity: 1 },
    dataLabels: {
      enabled: true,
      style: { colors: ["#fff"] },
    },
    colors: ["#4caf50e6", "#E94E24"],
  };

  const ordem = ["3", "1", "2"];

  return (
    <div className="savisionbarchart" style={{ width: "100%" }}>
      <div className="savisionbarchart__header">
        {ordem.map((turnoId) => {
          if (!turnos) return null;
          const turno = turnos[turnoId];
          if (!turno) return null; // caso não exista
          return (
            <div key={turnoId} className="savisionbarchart__turno-card">
              <h3 className="savisionbarchart__turno-title">Turno {turnoId}</h3>
              <div className="savisionbarchart__progress-bar">
                {Number(turno.ok) > 0 || Number(turno.ko) > 0
                  ? (() => {
                      const total = Number(turno.ok) + Number(turno.ko);
                      const okWidth = total > 0 ? (turno.ok / total) * 100 : 0;
                      const koWidth = total > 0 ? (turno.ko / total) * 100 : 0;

                      if (turno.ok > 0 && turno.ko > 0) {
                        // Os dois aparecem proporcionalmente
                        return (
                          <>
                            <div
                              className="savisionbarchart__progress-ok"
                              style={{ width: `${okWidth}%` }}
                            >
                              {turno.ok}
                            </div>
                            <div
                              className="savisionbarchart__progress-ko"
                              style={{ width: `${koWidth}%` }}
                            >
                              {turno.ko}
                            </div>
                          </>
                        );
                      } else if (turno.ok > 0) {
                        // Só ok
                        return (
                          <div
                            className="savisionbarchart__progress-ok"
                            style={{ width: "100%" }}
                          >
                            {turno.ok}
                          </div>
                        );
                      } else {
                        // Só ko
                        return (
                          <div
                            className="savisionbarchart__progress-ko"
                            style={{ width: "100%" }}
                          >
                            {turno.ko}
                          </div>
                        );
                      }
                    })()
                  : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="savisionbarchart__chart-wrapper">
        <Chart
          options={options}
          series={safeSeries || []}
          type="bar"
          height={250}
          className="savisionbarchart__chart"
        />
      </div>
    </div>
  );
};

export default SavisionBarChart;
