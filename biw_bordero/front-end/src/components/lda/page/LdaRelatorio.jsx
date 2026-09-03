import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer,
} from "recharts";
import "../styles/LdaRelatorio.css";
import { getLdaEventos } from "../../../../api/lda.http";
import {
  Btn,
  IconSpinner,
  IconRefresh,
} from "../../weldingreport/page/StatusMedicao";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getTurno(isoDate) {
  if (!isoDate) return "T3";
  const m = new Date(isoDate).getHours() * 60 + new Date(isoDate).getMinutes();
  if (m >= 360 && m < 948) return "T1";
  if (m >= 69 && m < 360) return "T3";
  return "T2";
}

function nomeTurnoLabel(t) {
  return t === "T1"
    ? "T1 · 06:00–15:48"
    : t === "T2"
      ? "T2 · 15:48–01:09"
      : "T3 · 01:09–06:00";
}

function isoDate(d) {
  if (!d) return "";
  if (d instanceof Date) {
    return d.toISOString().slice(0, 10);
  }
  if (typeof d === "string") {
    return d.slice(0, 10);
  }
  return String(d).slice(0, 10);
}

function extractDate(isoString) {
  if (!isoString) return null;
  if (typeof isoString === "string") {
    return isoString.slice(0, 10);
  }
  if (isoString instanceof Date) {
    return isoString.toISOString().slice(0, 10);
  }
  return null;
}

function labelData(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function calcCisFora(eventos) {
  const ordenados = [...eventos].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );

  const estado = {};

  ordenados.forEach((r) => {
    estado[r.cis] = r.evento;
  });

  return Object.keys(estado).filter((cis) => estado[cis] === 0);
}
function formatarDataHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano} ${hh}:${mm}`;
}

const CHART_COLORS = {
  blue: "#1a2e6f",
  red: "#c0392b",
  amber: "#c07000",
  green: "#1a7a45",
  borderLight: "#e8ecf5",
  textMuted: "#7a8aaa",
  textPrimary: "#1a2e6f",
};

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="lda-tooltip">
      <p className="lda-tooltip__title">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="lda-tooltip__item">
          <span
            className="lda-tooltip__dot"
            style={{ backgroundColor: p.color }}
          />
          <span className="lda-tooltip__text">
            {p.name}: <strong>{p.value}</strong>
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function LdaRelatorio() {
  const [dadosReais, setDadosReais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const response = await getLdaEventos();
      const responseData = Array.isArray(response)
        ? response
        : response?.data || [];

      const mappedData = responseData.map((item) => ({
        id: item.id,
        cis: item.cis,
        evento: item.evento,
        created_at: item.created_at,
        data_turno: extractDate(item.data_turno),
        turno: item.turno || getTurno(item.created_at),
      }));

      setDadosReais(mappedData);
      setNow(new Date());
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Falha ao atualizar dados");
    } finally {
      if (isInitial) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const todos = useMemo(() => dadosReais, [dadosReais]);
  const hoje = isoDate(new Date());

  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return isoDate(d);
  });
  const [dataFim, setDataFim] = useState(hoje);
  const [turnoFiltro, setTurnoFiltro] = useState("TODOS");
  const [buscaCi, setBuscaCi] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("TODOS");

  // ─── KPIS ──────────────────────────────────────────────────────────────────
  // ─── KPIS ──────────────────────────────────────────────────────────────────
  const kpiHoje = useMemo(() => {
    // 🔥 CORREÇÃO: Usar TODOS os dados para calcular os CIS fora de fluxo
    const todosEventos = todos; // todos os eventos do backend

    // Calcular CIS fora de fluxo considerando TODOS os dados
    const foraList = calcCisFora(todosEventos);

    // Para as estatísticas do dia, ainda filtramos apenas eventos de hoje
    const evHoje = todos.filter((r) => r.data_turno === hoje);

    return {
      fora: foraList.length,
      listaFora: foraList,
      extracoes: evHoje.filter((r) => r.evento === 0).length,
      insercoes: evHoje.filter((r) => r.evento === 1).length,
    };
  }, [todos, hoje]);
  const periodo = useMemo(() => {
    let arr = todos.filter((r) => {
      const d = r.data_turno;
      return d >= dataInicio && d <= dataFim;
    });
    if (turnoFiltro !== "TODOS") {
      arr = arr.filter((r) => {
        const turno = r.turno || getTurno(r.created_at);
        return turno === turnoFiltro;
      });
    }
    return arr;
  }, [todos, dataInicio, dataFim, turnoFiltro]);

  const ateDataFim = useMemo(
    () => todos.filter((r) => r.data_turno <= dataFim),
    [todos, dataFim],
  );
  const cisForaPeriodo = useMemo(() => calcCisFora(ateDataFim), [ateDataFim]);

  const totalExt = periodo.filter((r) => r.evento === 0).length;
  const totalIns = periodo.filter((r) => r.evento === 1).length;

  // ─── TABELA DE HISTÓRICO (já vem ordenado pelo ID) ──────────────────────
  const historicoEventos = useMemo(() => {
    let eventos = [...periodo];

    // Filtro por tipo de evento
    if (filtroEvento === "EXTRACAO") {
      eventos = eventos.filter((r) => r.evento === 0);
    } else if (filtroEvento === "INSERCAO") {
      eventos = eventos.filter((r) => r.evento === 1);
    }

    // Filtro por CIS
    if (buscaCi) {
      eventos = eventos.filter((r) =>
        r.cis.toLowerCase().includes(buscaCi.toLowerCase()),
      );
    }

    // Mantém a ordem original (já vem do banco ordenado por ID decrescente)
    return eventos;
  }, [periodo, filtroEvento, buscaCi]);

  // ─── GRÁFICOS ──────────────────────────────────────────────────────────────
  const graficoForaPorDia = useMemo(() => {
    const dias = [];
    const d = new Date(dataInicio + "T00:00:00");
    const fim = new Date(dataFim + "T23:59:59");
    while (d <= fim) {
      const corte = isoDate(d);
      const ate = todos.filter((r) => r.data_turno <= corte);
      const dodia = todos.filter((r) => r.data_turno === corte);
      dias.push({
        data: labelData(corte),
        fora: calcCisFora(ate).length,
        extracoes: dodia.filter((r) => r.evento === 0).length,
        insercoes: dodia.filter((r) => r.evento === 1).length,
      });
      d.setDate(d.getDate() + 1);
    }
    return dias;
  }, [todos, dataInicio, dataFim]);

  const graficoPorTurno = useMemo(() => {
    const m = {
      T3: { t: "T3", ins: 0, ext: 0 },
      T1: { t: "T1", ins: 0, ext: 0 },
      T2: { t: "T2", ins: 0, ext: 0 },
    };
    periodo.forEach((r) => {
      const turno = r.turno || getTurno(r.created_at);
      r.evento === 1 ? m[turno].ins++ : m[turno].ext++;
    });
    return Object.values(m);
  }, [periodo]);

  const taxaRetorno =
    totalExt > 0 ? Math.round((totalIns / totalExt) * 100) : 100;

  // ─── RENDERIZAÇÃO ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="lda-dashboard">
        <div className="lda-loading">
          <div className="lda-loading__spinner"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lda-dashboard">
        <div className="lda-error">
          <p>⚠️ {error}</p>
          <button onClick={() => fetchData(true)} className="lda-error__retry">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (dadosReais.length === 0) {
    return (
      <div className="lda-dashboard">
        <div className="lda-empty">
          <p>📭 Nenhum dado encontrado no banco</p>
          <button onClick={() => fetchData(true)} className="lda-empty__retry">
            Atualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lda-dashboard">
      <div className="lda-dashboard__content">
        {/* COLUNA ESQUERDA: SITUAÇÃO ATUAL */}
        <aside className="lda-dashboard__left-panel">
          <div className="lda-refresh-indicator">
            <span className="lda-refresh-indicator__time">
              Última atualização: {now.toLocaleTimeString("pt-BR")}
            </span>

            <Btn
              onClick={() => fetchData(false)}
              disabled={refreshing}
              style={{ marginLeft: 12 }}
            >
              {refreshing ? <IconSpinner /> : <IconRefresh />}
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Btn>
          </div>
          <div className="lda-section-title">
            Situação atual ·{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })}
          </div>

          <div
            className={`lda-live-card ${kpiHoje.fora > 0 ? "lda-live-card--alert" : "lda-live-card--success"}`}
          >
            <div>
              <div className="lda-live-card__label">Carrocerias fora fluxo</div>
              <div className="lda-live-card__main">
                <span className="lda-live-card__value">{kpiHoje.fora}</span>
                <span className="lda-live-card__subtext">sem retorno</span>
              </div>
              {kpiHoje.fora === 0 && (
                <div className="lda-live-card__status-msg">✓ Todas na base</div>
              )}
            </div>
            {/* 
            {kpiHoje.listaFora.length > 0 && (
              <div className="lda-live-card__chips">
                {kpiHoje.listaFora.map((c) => (
                  <span key={c} className="lda-live-card__chip">
                    {c}
                  </span>
                ))}
              </div>
            )} */}
          </div>

          <div className="lda-sub-grid">
            <div className="lda-sub-card lda-sub-card--amber">
              <div>
                <div className="lda-sub-card__label">Extrações hoje</div>
                <div className="lda-sub-card__value">{kpiHoje.extracoes}</div>
                <div className="lda-sub-card__info">saídas no dia</div>
              </div>
              <span className="lda-sub-card__icon">⬇️</span>
            </div>

            <div className="lda-sub-card lda-sub-card--green">
              <div>
                <div className="lda-sub-card__label">Inserções hoje</div>
                <div className="lda-sub-card__value">{kpiHoje.insercoes}</div>
                <div className="lda-sub-card__info">retornos no dia</div>
              </div>
              <span className="lda-sub-card__icon">⬆️</span>
            </div>

            <div
              className={`lda-sub-card ${kpiHoje.insercoes >= kpiHoje.extracoes ? "lda-sub-card--green" : "lda-sub-card--red"}`}
            >
              <div>
                <div className="lda-sub-card__label">Saldo hoje</div>
                <div className="lda-sub-card__value">
                  {kpiHoje.insercoes - kpiHoje.extracoes > 0
                    ? `+${kpiHoje.insercoes - kpiHoje.extracoes}`
                    : kpiHoje.insercoes - kpiHoje.extracoes}
                </div>
                <div className="lda-sub-card__info">ins. − ext.</div>
              </div>
              <span className="lda-sub-card__icon">
                {kpiHoje.insercoes >= kpiHoje.extracoes ? "✅" : "⚠️"}
              </span>
            </div>
          </div>
        </aside>

        {/* COLUNA DIREITA: ANÁLISE COMPLETA POR PERÍODO */}
        <main className="lda-dashboard__right-panel">
          {/* FILTROS INTEGRADOS */}
          <section className="lda-filters">
            <div className="lda-filters__dates">
              <span className="lda-filters__label">De</span>
              <input
                type="date"
                className="lda-filters__input"
                value={dataInicio}
                max={dataFim}
                onChange={(e) => setDataInicio(e.target.value)}
              />
              <span className="lda-filters__label">até</span>
              <input
                type="date"
                className="lda-filters__input"
                value={dataFim}
                min={dataInicio}
                max={hoje}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <div className="lda-filters__group">
              {[
                { label: "Hoje", dias: 0 },
                { label: "Ontem", dias: 1, especial: "ONTEM" },
                { label: "7 dias", dias: 6 },
                { label: "14 dias", dias: 13 },
                { label: "30 dias", dias: 29 },
              ].map((a) => {
                const ini = new Date();
                ini.setDate(ini.getDate() - a.dias);
                const iniStr = isoDate(ini);
                const ativo = dataInicio === iniStr && dataFim === hoje;
                return (
                  <button
                    key={a.label}
                    onClick={() => {
                      if (a.especial === "ONTEM") {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);

                        const ontem = isoDate(d);

                        setDataInicio(ontem);
                        setDataFim(ontem);
                        return;
                      }

                      const ini = new Date();
                      ini.setDate(ini.getDate() - a.dias);

                      setDataInicio(isoDate(ini));
                      setDataFim(hoje);
                    }}
                    className={`lda-filters__btn ${ativo ? "lda-filters__btn--active" : ""}`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>

            <div className="lda-filters__turnos">
              {["TODOS", "T3", "T1", "T2"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTurnoFiltro(t)}
                  className={`lda-filters__btn ${turnoFiltro === t ? "lda-filters__btn--active-light" : ""}`}
                >
                  {t === "TODOS" ? "Todos os turnos" : t}
                </button>
              ))}
            </div>
          </section>

          {/* KPIS DO PERÍODO SELECIONADO */}
          <section className="lda-kpi-grid">
            <div className="lda-kpi-card lda-kpi-card--red">
              <div className="lda-kpi-card__label">Carrocerias fora fluxo</div>
              <div className="lda-kpi-card__value">{cisForaPeriodo.length}</div>
              <div className="lda-kpi-card__sub">
                em{" "}
                {new Date(dataFim + "T12:00:00").toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </div>
            </div>

            <div className="lda-kpi-card lda-kpi-card--amber">
              <div className="lda-kpi-card__label">Extrações</div>
              <div className="lda-kpi-card__value">{totalExt}</div>
              <div className="lda-kpi-card__sub">no período</div>
            </div>

            <div className="lda-kpi-card lda-kpi-card--green">
              <div className="lda-kpi-card__label">Inserções</div>
              <div className="lda-kpi-card__value">{totalIns}</div>
              <div className="lda-kpi-card__sub">no período</div>
            </div>

            <div
              className={`lda-kpi-card ${taxaRetorno >= 80 ? "lda-kpi-card--green" : taxaRetorno >= 50 ? "lda-kpi-card--amber" : "lda-kpi-card--red"}`}
            >
              <div className="lda-kpi-card__label">Taxa</div>
              <div className="lda-kpi-card__value">{taxaRetorno}%</div>
              <div className="lda-kpi-card__sub">ins. / ext.</div>
            </div>

            <div className="lda-kpi-card lda-kpi-card--blue">
              <div className="lda-kpi-card__label">CIS movimentados</div>
              <div className="lda-kpi-card__value">
                {new Set(periodo.map((r) => r.cis)).size}
              </div>
              <div className="lda-kpi-card__sub">carrocerias</div>
            </div>
          </section>

          {/* GRÁFICOS LADO A LADO */}
          <section className="lda-charts-grid">
            <div className="lda-chart-panel">
              <div className="lda-chart-panel__title">Evolução diária</div>
              <div className="lda-chart-panel__desc">
                CIS fora ao fim do dia (linha) e movimentos (barras)
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={graficoForaPorDia}
                  margin={{ top: 24, right: 8, bottom: 0, left: -10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_COLORS.borderLight}
                  />
                  <XAxis
                    dataKey="data"
                    tick={{ fontSize: 10, fill: CHART_COLORS.textMuted }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: CHART_COLORS.textMuted }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: CHART_COLORS.red }}
                  />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="extracoes"
                    name="Extrações"
                    fill={CHART_COLORS.amber}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={20}
                  >
                    <LabelList
                      dataKey="extracoes"
                      position="top"
                      style={{ fontSize: 15, fontWeight: 600 }}
                    />
                  </Bar>

                  <Bar
                    yAxisId="left"
                    dataKey="insercoes"
                    name="Inserções"
                    fill={CHART_COLORS.green}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={20}
                  >
                    <LabelList
                      dataKey="insercoes"
                      position="top"
                      style={{ fontSize: 15, fontWeight: 600 }}
                    />
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="fora"
                    name="Acumulado Fora Fluxo"
                    stroke={CHART_COLORS.red}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lda-chart-panel">
              <div className="lda-chart-panel__title">Por turno</div>
              <div className="lda-chart-panel__desc">Movimentos no período</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart
                  data={graficoPorTurno}
                  layout="vertical"
                  margin={{ top: 0, right: 25, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_COLORS.borderLight}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: CHART_COLORS.textMuted }}
                  />
                  <YAxis
                    type="category"
                    dataKey="t"
                    tick={{
                      fontSize: 11,
                      fill: CHART_COLORS.textPrimary,
                      fontWeight: 600,
                    }}
                    tickFormatter={nomeTurnoLabel}
                    width={105}
                  />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="ext"
                    name="Extrações"
                    fill={CHART_COLORS.amber}
                    radius={[0, 3, 3, 0]}
                    maxBarSize={18}
                  >
                    <LabelList
                      dataKey="ext"
                      position="right"
                      style={{ fontSize: 15, fontWeight: 600 }}
                    />
                  </Bar>
                  <Bar
                    dataKey="ins"
                    name="Inserções"
                    fill={CHART_COLORS.green}
                    radius={[0, 3, 3, 0]}
                    maxBarSize={18}
                  >
                    <LabelList
                      dataKey="ins"
                      position="right"
                      style={{ fontSize: 15, fontWeight: 600 }}
                    />{" "}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* TABELA DE HISTÓRICO SIMPLIFICADA */}
          <section className="lda-table-card">
            <div className="lda-table-card__actions">
              <div className="lda-tabs">
                <button
                  onClick={() => setFiltroEvento("TODOS")}
                  className={`lda-tab ${filtroEvento === "TODOS" ? "is-active" : ""}`}
                >
                  Todos <span>{periodo.length}</span>
                </button>

                <button
                  onClick={() => setFiltroEvento("EXTRACAO")}
                  className={`lda-tab lda-tab--extracao ${filtroEvento === "EXTRACAO" ? "is-active" : ""}`}
                >
                  Extrações{" "}
                  <span>{periodo.filter((r) => r.evento === 0).length}</span>
                </button>

                <button
                  onClick={() => setFiltroEvento("INSERCAO")}
                  className={`lda-tab lda-tab--insercao ${filtroEvento === "INSERCAO" ? "is-active" : ""}`}
                >
                  Inserções{" "}
                  <span>{periodo.filter((r) => r.evento === 1).length}</span>
                </button>
              </div>
              <input
                placeholder="Buscar CIS…"
                value={buscaCi}
                onChange={(e) => setBuscaCi(e.target.value)}
                className="lda-table-card__search"
              />
            </div>

            <div className="lda-table-wrapper">
              <table className="lda-table">
                <thead>
                  <tr>
                    <th className="lda-table__th">#</th>
                    <th className="lda-table__th">CIS</th>
                    <th className="lda-table__th">Evento</th>
                    <th className="lda-table__th">Data/Hora</th>
                    <th className="lda-table__th">Turno</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoEventos.map((row, index) => (
                    <tr
                      key={`${row.cis}-${row.created_at}-${index}`}
                      className="lda-table__tr"
                    >
                      <td className="lda-table__td lda-table__td--center">
                        {index + 1}
                      </td>
                      <td className="lda-table__td lda-table__td--bold">
                        {row.cis}
                      </td>
                      <td className="lda-table__td">
                        <span
                          className={`lda-badge ${row.evento === 0 ? "lda-badge--extracao" : "lda-badge--insercao"}`}
                        >
                          <span className="lda-badge__dot" />
                          {row.evento === 0 ? "Extração" : "Inserção"}
                        </span>
                      </td>
                      <td className="lda-table__td">
                        {formatarDataHora(row.created_at)}
                      </td>
                      <td className="lda-table__td">
                        <span className="lda-table__turno">
                          {row.turno || getTurno(row.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {historicoEventos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="lda-table__empty">
                        {filtroEvento === "EXTRACAO"
                          ? "Nenhuma extração encontrada no período."
                          : filtroEvento === "INSERCAO"
                            ? "Nenhuma inserção encontrada no período."
                            : "Nenhum evento encontrado para os filtros selecionados."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
