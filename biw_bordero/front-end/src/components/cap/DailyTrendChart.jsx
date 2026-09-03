import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { formatMinutesToHHMMSS } from "./utils/capUtils";
import { useAggregationByPeriod } from "./hooks/useAggregationByPeriod";

const DailyTrendChart = ({
  data,
  metric = "dur_min",
  onSelect,
  activeFilter,
  height = 130,
}) => {
  const [level, setLevel] = useState("week");

  const aggregated = useAggregationByPeriod(data, metric, level);

  const formatValue = (val) => {
    if (metric === "dur_min") {
      return formatMinutesToHHMMSS(val);
    }

    return Math.floor(val);
  };

  const { categories, seriesData } = useMemo(
    () => ({
      categories: aggregated.map((i) => i.period),
      seriesData: aggregated.map((i) => i.total),
    }),
    [aggregated],
  );

  const labelStyle = {
    fontSize: "var(--font-xxs)",
    colors: "var(--text-secondary)",
    fontFamily: "var(--font-family)",
  };

  const options = useMemo(
    () => ({
      chart: {
        type: "line",
        toolbar: { show: false },
        background: "transparent",
        fontFamily: "var(--font-family)",

        events: {
          dataPointSelection: (_event, _ctx, config) => {
            const selected = categories[config.dataPointIndex];

            if (level === "month") {
              onSelect("mes", selected);
            } else if (level === "week") {
              onSelect("semana", selected);
            } else {
              onSelect("data", selected);
            }
          },
        },
      },

      stroke: {
        curve: "smooth",
        width: 3,
      },

      markers: {
        size: 3,
        strokeWidth: 1,
      },

      colors: ["#243782"],

      xaxis: {
        categories,

        labels: {
          style: labelStyle,
          hideOverlappingLabels: true,

          formatter: (val) => {
            if (level === "month") {
              return val;
            }

            if (level === "week") {
              return val;
            }

            const date = new Date(val);

            if (isNaN(date)) return val;

            return `${String(date.getDate()).padStart(
              2,
              "0",
            )}/${String(date.getMonth() + 1).padStart(2, "0")}`;
          },
        },

        axisBorder: {
          color: "var(--border-light)",
        },

        axisTicks: {
          color: "var(--border-light)",
        },
      },

      yaxis: {
        labels: {
          show: false,
        },
      },

      grid: {
        borderColor: "var(--border-light)",
        strokeDashArray: 4,
        padding: {
          top: -10, // espaço para os rótulos acima dos pontos
          right: 8,
          bottom: 0,
          left: 8,
        },
      },

      tooltip: {
        theme: "light",

        style: {
          fontSize: "var(--font-xs)",
          fontFamily: "var(--font-family)",
        },

        y: {
          formatter: (val) => formatValue(val),
        },
      },

      legend: {
        show: false,
      },

      dataLabels: {
        enabled: true,

        formatter: (val) => formatValue(val),

        offsetY: -6,

        style: {
          fontSize: "11px",
          fontWeight: 600,
          colors: ["#243782"],
        },

        background: {
          enabled: false,
        },
      },

      states: {
        hover: {
          filter: {
            type: "lighten",
            value: 0.1,
          },
        },

        active: {
          filter: {
            type: "darken",
            value: 0.15,
          },
        },
      },
    }),
    [categories, metric, level, onSelect],
  );

  const series = useMemo(
    () => [
      {
        name: metric === "dur_min" ? "Duração" : "Carros",
        data: seriesData,
      },
    ],
    [seriesData, metric],
  );

  const title =
    metric === "dur_min"
      ? `Duração por ${
          level === "month" ? "mês" : level === "week" ? "semana" : "dia"
        }`
      : `Carros por ${
          level === "month" ? "mês" : level === "week" ? "semana" : "dia"
        }`;

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <h2>{title}</h2>

        <div className="chart-toolbar">
          <button
            className={level === "month" ? "active" : ""}
            onClick={() => setLevel("month")}
          >
            Mês
          </button>

          <button
            className={level === "week" ? "active" : ""}
            onClick={() => setLevel("week")}
          >
            Semana
          </button>

          <button
            className={level === "day" ? "active" : ""}
            onClick={() => setLevel("day")}
          >
            Dia
          </button>
        </div>
      </div>

      {activeFilter && (
        <span className="chart-card__active-filter">
          {activeFilter}

          <span
            className="chart-card__active-filter-clear"
            onClick={() => {
              if (level === "month") {
                onSelect("mes", activeFilter);
              } else if (level === "week") {
                onSelect("semana", activeFilter);
              } else {
                onSelect("data", activeFilter);
              }
            }}
            title="Remover filtro"
          >
            ✕
          </span>
        </span>
      )}

      <Chart
        key={`trend-${metric}-${level}`}
        options={options}
        series={series}
        type="line"
        height={height}
      />
    </div>
  );
};

export default DailyTrendChart;
