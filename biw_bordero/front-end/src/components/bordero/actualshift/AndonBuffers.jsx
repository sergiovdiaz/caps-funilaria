import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import "./styles/AndonBuffers.css";

const AndonBuffers = () => {
  // ===== MOCK DE DADOS =====
  const mockData = (points = 12, baseValue = 50) => {
    const now = Date.now();

    return Array.from({ length: points }).map((_, i) => ({
      timestamp: new Date(now - (points - i) * 5 * 60 * 1000), // a cada 5 min
      value: Math.round(
        baseValue + Math.random() * 20 - 10 // variação
      ),
    }));
  };

  const data1 = mockData(12, 40);
  const data2 = mockData(12, 60);
  const data3 = mockData(12, 30);
  const data4 = mockData(12, 80);
  // ========================

  const buildSeries = (data, name) => [
    {
      name,
      data: data.map((d) => ({
        x: new Date(d.timestamp).getTime(),
        y: d.value,
      })),
    },
  ];

  const allData = [
    { data: data1, name: "Buffer 1 exemplo" },
    { data: data2, name: "Buffer 2 exemplo" },
    { data: data3, name: "Buffer 3 exemplo" },
    { data: data4, name: "Buffer 4 exemplo" },
  ].filter((d) => d.data.length > 0);

  const seriesList = allData.map((d) => buildSeries(d.data, d.name));

  const baseOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        height: 280,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "Segoe UI, sans-serif",
      },
      stroke: { curve: "smooth", width: 3 },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeFormatter: { hour: "HH:mm" },
          style: { colors: "#64748b", fontSize: "12px" },
        },
      },
      yaxis: {
        labels: { style: { colors: "#64748b", fontSize: "12px" } },
      },
      grid: { borderColor: "#e5e7eb", strokeDashArray: 4 },
      tooltip: { x: { format: "HH:mm" } },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          const lastIndex = opts.w.globals.series[opts.seriesIndex].length - 1;
          return opts.dataPointIndex === lastIndex ? val : undefined;
        },
      },
    }),
    []
  );

  const colors = ["#243782", "#0284c7", "#16a34a", "#d97706"];

  const gridColumns = allData.length <= 2 ? "1fr" : "1fr 1fr";

  return (
    <div
      className="andon-buffers"
      style={{ display: "grid", gridTemplateColumns: gridColumns, gap: "16px" }}
    >
      {seriesList.map((s, idx) => (
        <div className="buffer-card" key={idx}>
          <Chart
            options={{
              ...baseOptions,
              colors: [colors[idx]],
              title: {
                text: allData[idx].name,
                align: "left",
                style: {
                  color: colors[idx],
                  fontSize: "16px",
                  fontWeight: 700,
                },
              },
            }}
            series={s}
            type="area"
            height={230}
          />
        </div>
      ))}
    </div>
  );
};

export default AndonBuffers;
