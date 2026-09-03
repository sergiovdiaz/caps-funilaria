import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AsMainPage from "../components/bordero/actualshift/AsMainPage";
import DailyMainPage from "../components/bordero/daily/DailyMainPage";
import "../components/bordero/styles/Bordero.css";
import { LINES } from "../components/cap/utils/capConstant";

import {
  subscribeBordero,
  unsubscribeBordero,
  onBorderoData,
  offBorderoData,
} from "../../api/bordero.socket";

function formatDateDDMMYYYY(isoDate) {
  if (!isoDate) return "--";
  return new Date(isoDate).toLocaleDateString("pt-BR");
}

const Bordero = () => {
  const { line: paramLine } = useParams();

  const navigate = useNavigate();
  const line = paramLine?.toUpperCase();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  );

  const [searchParams, setSearchParams] = useSearchParams();

  const viewFromUrl = searchParams.get("view") || "turnoatual";
  const [viewMode, setViewMode] = useState(viewFromUrl);
  const [data, setData] = useState(null);
  const [headerInfo, setHeaderInfo] = useState({
    date: "--",
    shift: "--",
  });

  useEffect(() => {
    if (!line) return;

    const payload = {
      view: viewMode,
      line,
    };

    if (viewMode === "daily") {
      payload.date = selectedDate;
    }

    subscribeBordero(payload);

    const handler = (payload) => {
      if (payload.view !== viewMode) return;
      // console.log(payload);

      setData(payload.dados);

      // só turno atual tem header de turno
      if (viewMode === "turnoatual") {
        setHeaderInfo({
          date: payload?.dados?.date?.shift?.date,
          shift: payload?.dados?.date?.shift?.number,
        });
      }

      // diário
      if (viewMode === "daily") {
        setHeaderInfo({
          date: payload.date,
          shift: "--",
        });
      }
    };

    onBorderoData(handler);

    return () => {
      unsubscribeBordero({ view: viewMode, line });
      offBorderoData(handler);
    };
  }, [line, viewMode, selectedDate]);

  return (
    <div className="bordero-main">
      {/* HEADER */}
      <header className="bordero-main__header">
        <div className="bordero-main__header-left">
          <div className="bordero-main__view-filter">
            {["turnoatual", "daily"].map((mode) => (
              <button
                key={mode}
                className={`bordero-main__view-filter-btn ${viewMode === mode ? "active" : ""}`}
                onClick={() => {
                  setViewMode(mode);
                  setSearchParams({ view: mode });

                  //  Limpar dados para exibir skeleton imediatamente
                  setData(null);
                }}
              >
                {mode === "turnoatual"
                  ? "Turno Atual"
                  : mode === "shift"
                    ? "Turnos"
                    : "Diário"}
              </button>
            ))}
          </div>

          <div className="bordero-main__line-selector">
            <select
              className="bordero-main__line-selector-select"
              value={line || ""}
              onChange={(e) =>
                navigate(
                  `/bordero/${e.target.value.toLowerCase()}?view=${viewMode}`,
                )
              }
            >
              {LINES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bordero-main__header-right">
          {viewMode === "daily" ? (
            <div className="bordero-main__info">
              <span className="bordero-main__info-label">Data</span>
              <input
                type="date"
                className="bordero-main__date-picker"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="bordero-main__info">
                <span className="bordero-main__info-label">Data</span>
                <span className="bordero-main__info-value">
                  {formatDateDDMMYYYY(headerInfo.date)}
                </span>
              </div>
              <div className="bordero-main__info">
                <span className="bordero-main__info-label">Turno</span>
                <span className="bordero-main__info-value">
                  {headerInfo.shift}
                </span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* CONTENT */}
      {viewMode === "turnoatual" && <AsMainPage line={line} data={data} />}

      {viewMode === "shift" && (
        <div className="bordero-placeholder">📊 Tela de Turnos</div>
      )}

      {viewMode === "daily" && <DailyMainPage data={data} />}
    </div>
  );
};

export default Bordero;
