import React, { useMemo, useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTcHistory } from "./hooks/useTcHistory";
import { mapTcHistory } from "./utils/tcHistoryMapper";
import "./styles/SinopticoHistoryTc.css";
import Chart from "react-apexcharts";
import DateField from "../common/DateField";
import { useLocation } from "react-router-dom";

const SinopticoHistoryTc = () => {
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialLine = searchParams.get("line") || "AUE";
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [line, setLine] = useState(initialLine);
  const [view, setView] = useState("trend"); // "table" ou "trend"
  const [timeUnit, setTimeUnit] = useState("day"); // "week" ou "day"
  const [selectedStation, setSelectedStation] = useState("GERAL"); // "GERAL" ou station específica
  const [selectedModel, setSelectedModel] = useState("TODOS"); // novo filtro de modelo
  const [selectedMetric, setSelectedMetric] = useState("average"); // "average", "outPercentage", "outAverage"

  const metricOptions = [
    { value: "average", label: "TC Médio" },
    { value: "outPercentage", label: "% Ciclos Fora" },
    { value: "outAverage", label: "TC Médio Ciclos Fora" },
  ];

  const { history, target, loading, error } = useTcHistory({
    line,
    startDate,
    endDate,
  });

  const tableData = useMemo(() => mapTcHistory(history), [history]);
  const { sts, modelos, average, outPercentage, outAverage } = tableData;

  useEffect(() => {
    const newLine = searchParams.get("line");
    if (newLine) setLine(newLine);
  }, [location.search]);

  // ======================
  // Extrai lista de stations únicas
  // ======================
  const stations = useMemo(() => {
    if (!sts || sts.length === 0) return [];
    return sts;
  }, [sts]);

  // ======================
  // Filtra dados por station selecionada
  // ======================
  // Lista de modelos únicos para o select
  const modelOptions = useMemo(() => {
    if (!modelos || modelos.length === 0) return [];
    return ["TODOS", ...modelos];
  }, [modelos]);

  // Filtra os dados pelo modelo selecionado também
  const filteredHistory = useMemo(() => {
    if (!history || history.length === 0) return [];

    let data = [...history];

    if (selectedStation !== "GERAL") {
      data = data.filter((item) => item.st === selectedStation);
    }

    if (selectedModel !== "TODOS") {
      data = data.filter((item) => item.model === selectedModel);
    }

    // Agrupamento por semana ou dia caso esteja na visão geral
    if (selectedStation === "GERAL") {
      const grouped = {};
      data.forEach((item) => {
        const key = `${item.model}_${timeUnit === "week" ? item.week : item.date}`;
        if (!grouped[key]) {
          grouped[key] = {
            model: item.model,
            week: item.week,
            date: item.date,
            values: {
              average: [],
              outPercentage: [],
              outAverage: [],
            },
          };
        }
        grouped[key].values.average.push(parseFloat(item.average || 0));
        grouped[key].values.outPercentage.push(
          parseFloat(item.outPercentage || 0),
        );
        grouped[key].values.outAverage.push(parseFloat(item.outAverage || 0));
      });

      return Object.values(grouped).map((group) => ({
        model: group.model,
        week: group.week,
        date: group.date,
        average: (
          group.values.average.reduce((sum, val) => sum + val, 0) /
          group.values.average.length
        ).toFixed(2),
        outPercentage: (
          group.values.outPercentage.reduce((sum, val) => sum + val, 0) /
          group.values.outPercentage.length
        ).toFixed(2),
        outAverage: (
          group.values.outAverage.reduce((sum, val) => sum + val, 0) /
          group.values.outAverage.length
        ).toFixed(2),
      }));
    }

    return data;
  }, [history, selectedStation, timeUnit, selectedModel]);

  // ======================
  // Métricas resumidas para o trend
  // ======================
  const trendMetrics = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0) {
      return {
        totalRecords: 0,
        avgCycleTime: 0,
        bestModel: "-",
        worstModel: "-",
      };
    }

    const totalRecords = filteredHistory.length;
    const avgCycleTime = (
      filteredHistory.reduce(
        (sum, item) => sum + parseFloat(item[selectedMetric] || 0),
        0,
      ) / totalRecords
    ).toFixed(2);

    // Média por modelo
    const modelAverages = modelos.map((model) => {
      const modelData = filteredHistory.filter((h) => h.model === model);
      if (modelData.length === 0) return { model, avg: 0 };
      const avg =
        modelData.reduce(
          (sum, item) => sum + parseFloat(item[selectedMetric] || 0),
          0,
        ) / modelData.length;
      return { model, avg };
    });

    const validAverages = modelAverages.filter((m) => m.avg > 0);

    if (validAverages.length === 0) {
      return {
        totalRecords,
        avgCycleTime,
        bestModel: "-",
        worstModel: "-",
      };
    }

    const bestModel = validAverages.reduce((best, curr) =>
      curr.avg < best.avg ? curr : best,
    ).model;

    // Modelo a melhorar só se média > target
    const worstCandidate = validAverages.reduce((worst, curr) =>
      curr.avg > worst.avg ? curr : worst,
    );

    const worstModel = worstCandidate.avg > target ? worstCandidate.model : "-";

    return {
      totalRecords,
      avgCycleTime,
      bestModel,
      worstModel,
    };
  }, [filteredHistory, modelos, selectedMetric, target]);

  // ======================
  // Configura chart series
  // ======================
  const chartData = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0)
      return { series: [], categories: [] };

    const categories = Array.from(
      new Set(
        filteredHistory.map((h) =>
          timeUnit === "week"
            ? h.week
            : new Date(h.date).toLocaleDateString("pt-BR"),
        ),
      ),
    ).sort(
      (a, b) =>
        new Date(a.split("/").reverse().join("-")) -
        new Date(b.split("/").reverse().join("-")),
    );

    const series = modelos.map((model) => ({
      name: model,
      data: categories.map((cat) => {
        const item = filteredHistory.find((h) => {
          if (h.model !== model) return false;
          if (timeUnit === "week") return h.week === cat;
          const hDate = new Date(h.date).toLocaleDateString("pt-BR");
          return hDate === cat;
        });

        if (!item) return null;

        // Valor da métrica dinâmica
        return parseFloat(item[selectedMetric] || 0);
      }),
    }));

    return { series, categories };
  }, [filteredHistory, modelos, timeUnit, selectedMetric]); // <-- adicionei selectedMetric aqui

  // ======================
  // Paleta de cores profissional
  // ======================
  const chartColors = [
    "#1f77b4", // azul escuro
    "#ff7f0e", // laranja
    "#2ca02c", // verde
    "#d62728", // vermelho
    "#9467bd", // roxo
    "#8c564b", // marrom
    "#e377c2", // rosa
    "#7f7f7f", // cinza
    "#bcbd22", // amarelo oliva
    "#17becf", // azul claro/ciano
  ];

  const chartOptions = {
    chart: {
      type: "line",
      height: 450,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    colors: chartColors,
    stroke: {
      curve: "smooth",
      width: 3,
      lineCap: "round",
    },
    markers: {
      size: 5,
      strokeWidth: 2,
      strokeColors: "#fff",
      hover: {
        size: 7,
      },
    },
    grid: {
      borderColor: "#e0e6ed",
      strokeDashArray: 3,
      row: {
        colors: ["transparent", "rgba(239, 242, 248, 0.3)"],
        opacity: 0.5,
      },
      padding: {
        top: 0,
        right: 20,
        bottom: 0,
        left: 10,
      },
    },
    xaxis: {
      categories: chartData.categories,
      title: {
        text: timeUnit === "week" ? "Semana" : "Dia",
        style: {
          color: "#243782",
          fontSize: "14px",
          fontWeight: 700,
        },
      },
      labels: {
        style: {
          colors: "#2c3e50",
          fontSize: "13px",
          fontWeight: 600,
        },
        rotate: -45,
        rotateAlways: chartData.categories.length > 10,
      },
      axisBorder: {
        show: true,
        color: "#243782",
      },
      axisTicks: {
        show: true,
        color: "#243782",
      },
    },
    yaxis: {
      title: {
        text:
          selectedMetric === "average"
            ? "Tempo Ciclo Médio (s)"
            : selectedMetric === "outPercentage"
              ? "% Ciclos Fora"
              : "TC Médio Fora Ciclo (s)",
        style: {
          color: "#243782",
          fontSize: "14px",
          fontWeight: 700,
        },
      },
      labels: {
        style: {
          colors: "#2c3e50",
          fontSize: "13px",
          fontWeight: 600,
        },
        formatter: (value) => (value ? value.toFixed(2) : "0"),
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      style: {
        fontSize: "14px",
        fontFamily: "inherit",
      },
      y: {
        formatter: (value) => (value ? `${value.toFixed(2)}` : "N/A"),
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "14px",
      fontWeight: 600,
      markers: {
        width: 12,
        height: 12,
        radius: 2,
      },
      itemMargin: {
        horizontal: 15,
        vertical: 8,
      },
      onItemClick: {
        toggleDataSeries: true,
      },
      onItemHover: {
        highlightDataSeries: true,
      },
    },

    // Linha de referência do target
    annotations:
      target && selectedMetric !== "outPercentage"
        ? {
            yaxis: [
              {
                y: target,
                borderColor: "#ef4444",
                strokeDashArray: 5,
                label: {
                  borderColor: "#ef4444",
                  style: {
                    color: "#fff",
                    background: "#ef4444",
                    fontSize: "12px",
                    fontWeight: 700,
                  },
                  text: `Target: ${target}s`,
                },
              },
            ],
          }
        : {},
  };

  // Mapear cada modelo para uma cor da paleta
  const modelColors = useMemo(() => {
    const map = {};
    modelos.forEach((model, index) => {
      map[model] = chartColors[index % chartColors.length]; // garante que não estoure a paleta
    });
    return map;
  }, [modelos, chartColors]);

  return (
    <div className="tc-history">
      {/* Header & Filtros */}
      <header className="tc-history__header">
        {/* Linha */}
        <div className="tc-history__control-group">
          <label className="tc-history__label">Linha</label>
          <select
            className="tc-history__select"
            value={line}
            onChange={(e) => setLine(e.target.value)}
          >
            <option value="SCC">SCC</option>
            <option value="SCE">SCE</option>
            <option value="AUE">AUE</option>
            <option value="AUC">AUC</option>
          </select>
        </div>

        {/* Station (apenas no trend) */}
        {view === "trend" && (
          <div className="tc-history__control-group">
            <label className="tc-history__label">Station</label>
            <select
              className="tc-history__select"
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
            >
              <option value="GERAL">Geral (Todas)</option>
              {stations.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Data Início */}
        <div className="tc-history__control-group">
          <label className="tc-history__label">Data Início</label>
          <div className="tc-history__date-wrapper">
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              className="tc-history__input"
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>

        {/* Data Fim */}
        <div className="tc-history__control-group">
          <label className="tc-history__label">Data Fim</label>
          <div className="tc-history__date-wrapper">
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              className="tc-history__input"
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>

        {/* Toggle visão */}
        <div className="tc-history__control-group">
          <label className="tc-history__label">Visão</label>
          <select
            className="tc-history__select"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            <option value="table">Tabela</option>
            <option value="trend">Trend</option>
          </select>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="tc-history__content">
        {loading && (
          <div className="tc-history__status tc-history__status--loading">
            Carregando dados...
          </div>
        )}
        {error && (
          <div className="tc-history__status tc-history__status--error">
            {error}
          </div>
        )}

        {!loading && !error && view === "table" && (
          <>
            <TableSection
              title="Tempo Ciclo Médio"
              modelos={modelos}
              sts={sts}
              data={average}
              target={target}
              highlightByTarget
            />
            <TableSection
              title="Percentual de Ciclos Fora do Target"
              modelos={modelos}
              sts={sts}
              data={outPercentage}
              target={40}
              highlightByTarget
              isPercentage={true}
            />
            <TableSection
              title="Tempo Ciclo Médio dos Ciclos Fora do Target"
              modelos={modelos}
              sts={sts}
              data={outAverage}
              target={target}
              highlightByTarget={false}
            />
          </>
        )}

        {!loading && !error && view === "trend" && (
          <div className="tc-history__trend-container">
            {/* Header do Trend */}
            <div className="tc-history__trend-header">
              <div>
                <h2 className="tc-history__trend-title">
                  Análise de Tendência - {line}
                  <span
                    className={`tc-history__station-badge ${selectedStation === "GERAL" ? "tc-history__station-badge--geral" : ""}`}
                  >
                    {selectedStation === "GERAL"
                      ? " Visão Geral"
                      : ` ${selectedStation}`}
                  </span>
                </h2>

                <p className="tc-history__trend-subtitle">
                  {selectedStation === "GERAL"
                    ? "Média geral de todas as stations"
                    : `Station ${selectedStation}`}{" "}
                  - Evolução do tempo de ciclo por modelo{" "}
                  {timeUnit === "week" ? "(semanal)" : "(diário)"}
                </p>
              </div>

              {/* Filtros alinhados à direita */}
              {/* Filtros alinhados à direita */}
              <div className="tc-history__trend-filters">
                {/* Filtro de unidade de tempo */}
                <div className="tc-history__control-group">
                  <label className="tc-history__label">Unidade de tempo</label>
                  <select
                    className="tc-history__select"
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value)}
                  >
                    <option value="week">Semana</option>
                    <option value="day">Dia</option>
                  </select>
                </div>

                {/* Filtro de modelo */}
                <div className="tc-history__control-group">
                  <label className="tc-history__label">Modelo</label>
                  <select
                    className="tc-history__select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {modelOptions.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro de métrica */}
                <div className="tc-history__control-group">
                  <label className="tc-history__label">Métrica</label>
                  <select
                    className="tc-history__select"
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                  >
                    {metricOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Métricas Resumidas */}
            <div className="tc-history__trend-metrics">
              <div className="tc-history__metric-card">
                <div className="tc-history__metric-label">Média Geral</div>
                <div className="tc-history__metric-value">
                  {trendMetrics.avgCycleTime}
                  <span className="tc-history__metric-unit">s</span>
                </div>
              </div>
              <div className="tc-history__metric-card">
                <div className="tc-history__metric-label">Melhor Modelo</div>
                <div
                  className="tc-history__metric-value"
                  style={{
                    color: modelColors[trendMetrics.bestModel] || "#000",
                  }}
                >
                  {trendMetrics.bestModel}
                </div>
              </div>
              <div className="tc-history__metric-card">
                <div className="tc-history__metric-label">
                  Modelo a Melhorar
                </div>
                <div
                  className="tc-history__metric-value"
                  style={{
                    color: modelColors[trendMetrics.worstModel] || "#000",
                  }}
                >
                  {trendMetrics.worstModel}
                </div>
              </div>
            </div>

            {/* Gráfico */}
            <div className="tc-history__chart-wrapper">
              {chartData.series.length > 0 ? (
                <Chart
                  options={chartOptions}
                  series={chartData.series}
                  type="line"
                  height={390}
                />
              ) : (
                <div className="tc-history__trend-empty">
                  <div className="tc-history__trend-empty-title">
                    Nenhum dado disponível
                  </div>
                  <p className="tc-history__trend-empty-text">
                    Selecione um período com dados para visualizar a tendência
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Componente de Tabela extraído e modularizado
const TableSection = ({
  title,
  modelos,
  sts,
  data,
  target,
  highlightByTarget = false,
  isPercentage = false,
}) => {
  if (!modelos || modelos.length === 0) return null;

  const renderValue = (value) => {
    if (value == null) return "-";

    const numericValue = Number(value);
    const numericTarget = Number(target);

    if (Number.isNaN(numericValue)) {
      return value;
    }

    const displayValue = isPercentage ? `${numericValue}%` : numericValue;

    if (!highlightByTarget || Number.isNaN(numericTarget)) {
      return displayValue;
    }

    const isOk = numericValue <= numericTarget;

    return (
      <span
        className={`tc-value-pill ${
          isOk ? "tc-value-pill--ok" : "tc-value-pill--bad"
        }`}
      >
        {displayValue}
      </span>
    );
  };

  const renderTarget = () => {
    if (target == null) return null;

    const numericTarget = Number(target);
    if (Number.isNaN(numericTarget)) return null;

    return (
      <div className="tc-table-card__target">
        Target:{" "}
        <strong>{isPercentage ? `${numericTarget}%` : numericTarget}</strong>
      </div>
    );
  };

  return (
    <section className="tc-table-card">
      {/* Header */}
      <div className="tc-table-card__header">
        <h3 className="tc-table-card__title">{title}</h3>
        {renderTarget()}
      </div>

      <div className="tc-table-card__responsive-wrapper">
        <table className="tc-table">
          <thead className="tc-table__head">
            <tr className="tc-table__row tc-table__row--header">
              <th className="tc-table__cell tc-table__cell--header">Modelo</th>
              <th className="tc-table__cell tc-table__cell--header">Geral</th>
              {sts.map((st) => (
                <th key={st} className="tc-table__cell tc-table__cell--header">
                  {st}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="tc-table__body">
            {modelos.map((model) => (
              <tr key={model} className="tc-table__row">
                <td className="tc-table__cell tc-table__cell--highlight">
                  {model}
                </td>

                <td className="tc-table__cell">
                  {renderValue(data?.Geral?.[model])}
                </td>

                {sts.map((st) => (
                  <td key={st} className="tc-table__cell">
                    {renderValue(data?.[st]?.[model])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SinopticoHistoryTc;
