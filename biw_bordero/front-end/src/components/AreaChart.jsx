import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import moment from "moment-timezone";

const AreaChart = ({ line, series, info }) => {
  const maxY = useMemo(
    () =>
      series[0]?.data
        ? Math.max(6, ...series[0].data.map((item) => item.y))
        : 6,
    [series],
  );

  const formatXAxis = useMemo(
    () => (value) => moment(value).tz("America/Recife").format("HH:mm"),
    [],
  );

  const options = useMemo(
    () => ({
      chart: {
        id: "basic-area",
        toolbar: {
          show: false,
          // tools: { zoomin: true, zoomout: true, reset: true },
          // export: { csv: true, svg: true },
        },
        // zoom: { enabled: true, allowMouseWheelZoom: false },
      },
      title: {
        text: line || "",
        align: "left",
        margin: 20,
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          fontFamily: "Arial, sans-serif",
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val, opts) =>
          opts.seriesIndex === 0 &&
          opts.dataPointIndex === series[0]?.data.length - 1
            ? `${val}`
            : undefined,
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        x: { format: "HH:mm" },
      },
      xaxis: {
        labels: { formatter: formatXAxis, rotate: 0 },
        tickAmount: 2,
        max: 13,
      },
      yaxis: {
        max: maxY,
        min: 0,
        labels: { formatter: (value) => Math.floor(value) },
      },
    }),
    [line, formatXAxis, maxY, series],
  );

  return (
    <div className="areachart" style={{ position: "relative" }}>
      <Chart options={options} series={series} type="area" width="250" />

      <div className="areachart__infobox">
        <div className="areachart__infobox-item">
          <span className="areachart__infobox-value">{info.producaoTurno}</span>
          <span className="areachart__infobox-label">Produção/turno</span>
        </div>
        <div className="areachart__infobox-item">
          <span className="areachart__infobox-value">{info.velocidade}</span>
          <span className="areachart__infobox-label">JPH</span>
        </div>
        <div className="areachart__infobox-item">
          <span className="areachart__infobox-value">{info.tempoCiclo}</span>
          <span className="areachart__infobox-label">Tempo Ciclo</span>
        </div>
      </div>
    </div>
  );
};

export default AreaChart;
