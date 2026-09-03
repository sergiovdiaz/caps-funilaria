import { useState, useMemo, useEffect } from "react";
import { getStatusMedicao } from "../../../../api/welding.http";
import { exportToExcel } from "../../common/utils/exportToExcel";

const OFFLINE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function parseDate(str) {
  return new Date(str.replace(/([+-]\d{2})$/, "$1:00"));
}
function isOffline(last_seen_at, now = new Date()) {
  return now - parseDate(last_seen_at) > OFFLINE_THRESHOLD_MS;
}
function fmtDate(str) {
  return parseDate(str).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
function timeSince(str, now = new Date()) {
  const diff = now - parseDate(str);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h atrás`;
  if (h > 0) return `${h}h ${m}m atrás`;
  return `${m}m atrás`;
}

const CSS_VARS = `

  body { font-family: var(--font-family); background: var(--bg-standard); }
  .wm-btn { cursor:pointer; font-family:var(--font-family); transition:var(--transition); }
  .wm-btn:hover { opacity:.85; }
  .wm-row:hover td { background: var(--blue-light-bg); }
  .wm-input:focus { border-color: var(--blue-standard) !important; box-shadow: 0 0 0 3px rgba(36,55,130,0.1); }
  .wm-stat:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
  .wm-stat { transition: var(--transition); }
`;

// ── Botão padronizado ─────────────────────────────────────────────────────────
export function Btn({
  children,
  onClick,
  variant = "ghost",
  style: extraStyle = {},
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--spacing-xs)",
    padding: "5px 13px",
    height: 32,
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--font-xs)",
    fontWeight: "var(--font-weight-semibold)",
    cursor: "pointer",
    border: "1px solid",
    transition: "var(--transition)",
    fontFamily: "var(--font-family)",
    whiteSpace: "nowrap",
  };
  const variants = {
    ghost: {
      borderColor: "var(--border-color)",
      background: "var(--bg-white)",
      color: "var(--text-secondary)",
    },
    active: {
      borderColor: "var(--blue-standard)",
      background: "var(--blue-light-bg)",
      color: "var(--blue-standard)",
    },
    success: {
      borderColor: "#b2dfca",
      background: "var(--color-success-bg)",
      color: "var(--color-success)",
    },
  };
  return (
    <button
      className="wm-btn"
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...extraStyle }}
    >
      {children}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const IconChevron = ({ open }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform var(--transition)",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconWrench = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const IconCheck = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconWifiOff = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <path d="M5 13a10 10 0 0 1 5.17-2.88" />
    <path d="M10.71 5.05A16 16 0 0 1 22.54 9" />
    <path d="M1.42 9a16 16 0 0 1 4.7-2.88" />
    <circle cx="12" cy="20" r="1" />
  </svg>
);
const IconDownload = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const IconRefresh = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconExpand = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const IconCollapse = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="10" y1="14" x2="3" y2="21" />
    <line x1="21" y1="3" x2="14" y2="10" />
  </svg>
);

export const IconSpinner = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ animation: "wm-spin 0.8s linear infinite" }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ type }) {
  const cfg = {
    primary: {
      bg: "var(--color-error-bg)",
      color: "var(--color-error)",
      border: "var(--color-error-border)",
      label: "Primário",
      icon: <IconWrench />,
    },
    secondary: {
      bg: "var(--color-success-bg)",
      color: "var(--color-success)",
      border: "#b2dfca",
      label: "Secundário",
      icon: <IconCheck />,
    },
    offline: {
      bg: "var(--color-warning-bg)",
      color: "var(--color-warning-text)",
      border: "var(--color-warning-border)",
      label: "Fora de rede",
      icon: <IconWifiOff />,
    },
  };
  const s = cfg[type];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--spacing-xs)",
        fontSize: "var(--font-xs)",
        fontWeight: "var(--font-weight-semibold)",
        padding: "3px 8px",
        borderRadius: "var(--radius-sm)",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        letterSpacing: "0.02em",
      }}
    >
      {s.icon} {s.label}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub, borderColor }) {
  return (
    <div
      className="wm-stat"
      style={{
        background: "var(--bg-white)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-lg) var(--spacing-xl)",
        flex: 1,
        minWidth: 120,
        borderLeft: `4px solid ${borderColor || color}`,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          fontSize: "var(--font-2xl)",
          fontWeight: "var(--font-weight-bold)",
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "var(--font-sm)",
          color: "var(--text-secondary)",
          fontWeight: "var(--font-weight-semibold)",
          marginTop: "var(--spacing-xs)",
        }}
      >
        {label}
      </div>
      {sub && (
        <div
          style={{
            fontSize: "var(--font-xs)",
            color: "var(--text-muted)",
            marginTop: "var(--spacing-xxs)",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Clamp Row ─────────────────────────────────────────────────────────────────
function ClampRow({ item, now }) {
  const offline = isOffline(item.last_seen_at, now);
  const badgeType = offline
    ? "offline"
    : item.value === "0"
      ? "primary"
      : "secondary";
  return (
    <tr
      className="wm-row"
      style={{
        borderBottom: "1px solid var(--border-light)",
        transition: "var(--transition)",
      }}
    >
      <td
        style={{
          padding: "9px 14px",
          fontSize: "var(--font-sm)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--text-primary)",
          fontFamily: "monospace",
          letterSpacing: "0.03em",
        }}
      >
        {item.timer_name}
      </td>
      <td style={{ padding: "9px 14px" }}>
        <Badge type={badgeType} />
      </td>
      <td
        style={{
          padding: "9px 14px",
          fontSize: "var(--font-xs)",
          color: "var(--text-muted)",
        }}
      >
        {fmtDate(item.status_since)}
      </td>
      <td
        style={{
          padding: "9px 14px",
          fontSize: "var(--font-xs)",
          color: offline ? "var(--color-warning-text)" : "var(--text-muted)",
          fontWeight: offline
            ? "var(--font-weight-semibold)"
            : "var(--font-weight-normal)",
        }}
      >
        {timeSince(item.last_seen_at, now)}
      </td>
    </tr>
  );
}

// ── Line Section ──────────────────────────────────────────────────────────────
function LineSection({ lineName, items, expandedAll, now }) {
  const [open, setOpen] = useState(true);
  const primary = items.filter(
    (i) => i.value === "0" && !isOffline(i.last_seen_at, now),
  ).length;
  const offline = items.filter((i) => isOffline(i.last_seen_at, now)).length;

  useEffect(() => {
    setOpen(expandedAll);
  }, [expandedAll]);

  return (
    <div
      style={{
        background: "var(--bg-white)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        marginBottom: "var(--spacing-md)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="wm-btn wm-section-header"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-md)",
          padding: "var(--spacing-md) var(--spacing-lg)",
          background: open ? "var(--bg-muted)" : "var(--bg-white)",
          borderBottom: open ? "1px solid var(--border-light)" : "none",
          userSelect: "none",
        }}
      >
        <span
          style={{
            background: "var(--blue-standard)",
            color: "var(--text-white)",
            fontWeight: "var(--font-weight-bold)",
            fontSize: "var(--font-sm)",
            padding: "3px 10px",
            borderRadius: "var(--radius-sm)",
            fontFamily: "monospace",
            letterSpacing: "0.06em",
          }}
        >
          {lineName}
        </span>
        <span
          style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}
        >
          {items.length} pinças
        </span>
        {primary > 0 && (
          <span
            style={{
              fontSize: "var(--font-xs)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-error)",
              background: "var(--color-error-bg)",
              border: "1px solid var(--color-error-border)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconWrench /> {primary} primário
          </span>
        )}
        {offline > 0 && (
          <span
            style={{
              fontSize: "var(--font-xs)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-warning-text)",
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning-border)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconWifiOff /> {offline} fora de rede
          </span>
        )}
        <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>
          <IconChevron open={open} />
        </span>
      </div>
      {open && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "var(--gray-50)",
                borderBottom: "1px solid var(--border-light)",
              }}
            >
              {["Pinça", "Status", "Desde", "Última comunicação"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "7px 14px",
                    textAlign: "left",
                    fontSize: "var(--font-xxs)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <ClampRow key={item.timer_name} item={item} now={now} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Colunas para exportação ───────────────────────────────────────────────────
const EXPORT_COLUMNS = [
  { key: "line_name", label: "Linha" },
  { key: "timer_name", label: "Pinça" },
  { key: "status", label: "Status" },
  { key: "status_since_fmt", label: "Desde" },
  { key: "last_seen_fmt", label: "Última comunicação" },
];

function prepareExportData(data, now) {
  return data.map((item) => {
    const offline = isOffline(item.last_seen_at, now);
    const status = offline
      ? "Fora de rede"
      : item.value === "0"
        ? "Primário"
        : "Secundário";
    return {
      ...item,
      status,
      status_since_fmt: fmtDate(item.status_since),
      last_seen_fmt: fmtDate(item.last_seen_at),
    };
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StatusMedicao() {
  const [search, setSearch] = useState("");
  const [filterLine, setFilterLine] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());
  const [expandedAll, setExpandedAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial)
        setLoading(true); // só mostra loading na primeira vez
      else setRefreshing(true);
      const response = await getStatusMedicao();
      const responseData = Array.isArray(response)
        ? response
        : response?.data || [];
      setData(responseData);
      setNow(new Date());
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Falha ao atualizar dados");
    } finally {
      if (isInitial) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true); // primeira carga com loading
    const timeInterval = setInterval(() => setNow(new Date()), 60000);
    const dataInterval = setInterval(() => fetchData(false), 30000); // sem loading
    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const lines = useMemo(
    () => [...new Set(data.map((d) => d.line_name))].sort(),
    [data],
  );

  const filtered = useMemo(
    () =>
      data.filter((item) => {
        const offline = isOffline(item.last_seen_at, now);
        if (filterLine !== "all" && item.line_name !== filterLine) return false;
        if (filterStatus === "primary" && (item.value !== "0" || offline))
          return false;
        if (filterStatus === "secondary" && (item.value !== "1" || offline))
          return false;
        if (filterStatus === "offline" && !offline) return false;
        if (
          search &&
          !item.timer_name.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [search, filterLine, filterStatus, data, now],
  );

  const grouped = useMemo(() => {
    const g = {};
    for (const item of filtered) {
      if (!g[item.line_name]) g[item.line_name] = [];
      g[item.line_name].push(item);
    }
    return g;
  }, [filtered]);

  const totalPrimary = data.filter(
    (d) => d.value === "0" && !isOffline(d.last_seen_at, now),
  ).length;
  const totalSecondary = data.filter(
    (d) => d.value === "1" && !isOffline(d.last_seen_at, now),
  ).length;
  const totalOffline = data.filter((d) =>
    isOffline(d.last_seen_at, now),
  ).length;

  const handleExport = () => {
    exportToExcel({
      data: prepareExportData(data, now),
      columns: EXPORT_COLUMNS,
      fileName: "status_medicao",
    });
  };

  if (loading) {
    return (
      <div style={{ width: "100%", fontFamily: "var(--font-family)" }}>
        <style>{CSS_VARS}</style>
        <div
          style={{
            padding: "0 var(--spacing-2xl)",
            margin: "0",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "var(--font-md)", color: "var(--text-muted)" }}>
            Carregando dados das pinças...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: "100%", fontFamily: "var(--font-family)" }}>
        <style>{CSS_VARS}</style>
        <div
          style={{
            margin: "0 auto",
            padding: "0 var(--spacing-2xl)",
            textAlign: "center",
          }}
        >
          <p
            style={{ fontSize: "var(--font-md)", color: "var(--color-error)" }}
          >
            {error}
          </p>
          <Btn onClick={fetchData} style={{ marginTop: "var(--spacing-md)" }}>
            Tentar novamente
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", fontFamily: "var(--font-family)" }}>
      <style>{CSS_VARS}</style>
      <div
        style={{
          // maxWidth: 960,
          margin: "0 auto",
          padding: "0 var(--spacing-2xl)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "var(--spacing-2xl)" }}>
          {/* <h1
            style={{
              fontSize: "var(--font-xl)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--text-primary)",
              marginBottom: "var(--spacing-xxs)",
            }}
          >
            Monitoramento de Pinças
          </h1> */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--spacing-sm)",
            }}
          >
            <p
              style={{ fontSize: "var(--font-sm)", color: "var(--text-muted)" }}
            >
              Atualizado em{" "}
              {now.toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-xs)",
                flexWrap: "wrap",
              }}
            >
              <Btn onClick={() => fetchData(false)} disabled={refreshing}>
                {refreshing ? <IconSpinner /> : <IconRefresh />}
                {refreshing ? "Atualizando..." : "Atualizar"}
              </Btn>

              <Btn onClick={() => setExpandedAll((p) => !p)}>
                {expandedAll ? (
                  <>
                    <IconCollapse /> Colapsar todos
                  </>
                ) : (
                  <>
                    <IconExpand /> Expandir todos
                  </>
                )}
              </Btn>
              <Btn onClick={handleExport} variant="success">
                <IconDownload /> Exportar Excel
              </Btn>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-md)",
            marginBottom: "var(--spacing-2xl)",
            flexWrap: "wrap",
          }}
        >
          <StatCard
            label="Primário"
            value={totalPrimary}
            color="var(--color-error)"
            borderColor="var(--color-error)"
            sub="Requer atenção"
          />
          <StatCard
            label="Secundário"
            value={totalSecondary}
            color="var(--color-success)"
            borderColor="var(--color-success)"
            sub="Condição OK"
          />
          <StatCard
            label="Fora de Rede"
            value={totalOffline}
            color="var(--color-warning-text)"
            borderColor="var(--color-warning)"
            sub="+24h sem sinal"
          />
          <StatCard
            label="Total de Pinças"
            value={data.length}
            color="var(--blue-standard)"
            borderColor="var(--blue-standard)"
            sub={`${lines.length} linhas`}
          />
        </div>

        {/* Filter bar */}
        <div
          style={{
            background: "var(--bg-white)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-md) var(--spacing-lg)",
            marginBottom: "var(--spacing-md)",
            display: "flex",
            gap: "var(--spacing-md)",
            flexWrap: "wrap",
            alignItems: "center",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 180px" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--gray-400)",
                display: "flex",
              }}
            >
              <IconSearch />
            </span>
            <input
              className="wm-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pinça..."
              style={{
                width: "100%",
                paddingLeft: 32,
                paddingRight: 10,
                height: 34,
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-sm)",
                outline: "none",
                background: "var(--bg-input)",
                color: "var(--text-dark)",
                fontFamily: "var(--font-family)",
                transition: "var(--transition)",
              }}
            />
          </div>

          {/* Line select */}
          <select
            value={filterLine}
            onChange={(e) => setFilterLine(e.target.value)}
            style={{
              height: 32,
              padding: "0 10px",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--font-sm)",
              color: "var(--text-secondary)",
              background: "var(--bg-input)",
              cursor: "pointer",
              fontFamily: "var(--font-family)",
            }}
          >
            <option value="all">Todas as linhas</option>
            {lines.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Status filter buttons */}
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-xs)",
              flexWrap: "wrap",
            }}
          >
            {[
              ["all", "Todos"],
              ["primary", "Primário"],
              ["secondary", "Secundário"],
              ["offline", "Fora de rede"],
            ].map(([val, label]) => (
              <Btn
                key={val}
                onClick={() => setFilterStatus(val)}
                variant={filterStatus === val ? "active" : "ghost"}
              >
                {label}
              </Btn>
            ))}
          </div>
        </div>

        {/* Count */}
        <div
          style={{
            fontSize: "var(--font-xs)",
            color: "var(--text-muted)",
            marginBottom: "var(--spacing-sm)",
            paddingLeft: 2,
          }}
        >
          Exibindo {filtered.length} pinças em {Object.keys(grouped).length}{" "}
          linha(s)
        </div>

        {/* Groups */}
        {Object.keys(grouped).sort().length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--text-muted)",
              fontSize: "var(--font-md)",
            }}
          >
            Nenhuma pinça encontrada com os filtros selecionados.
          </div>
        ) : (
          Object.keys(grouped)
            .sort()
            .map((line) => (
              <LineSection
                key={line}
                lineName={line}
                items={grouped[line]}
                expandedAll={expandedAll}
                now={now}
              />
            ))
        )}
      </div>
    </div>
  );
}
