import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CycleTimeGraph from "../components/CycleTimeGraph";
import "../components/styles/CycleTime.css";
import { dicMaq } from "../assets/database/tc";
import { useReplayController } from "../components/tc/hooks/useReplayController";
import { useTcReplay } from "../components/tc/hooks/useTcReplay";
import { exportReplayToExcel } from "../components/tc/hooks/utils/exportReplayToExcel";

const formatDateTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CycleTime = () => {
  const navigate = useNavigate();

  const [selectedLine, setSelectedLine] = useState("SCC");
  const [selectedStation, setSelectedStation] = useState("Geral");

  const [mode, setMode] = useState("LIVE");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { replayData, loading, fetchReplay } = useTcReplay();

  //  HOOK CENTRAL DE CONTROLE
  const replayController = useReplayController(replayData);

  const getStationsForLine = (line) => {
    const stations = dicMaq[line] || {};
    return ["Geral", ...Object.keys(stations)];
  };

  const handleExportExcel = () => {
    exportReplayToExcel({
      replayData,
      selectedLine,
      startDate,
      endDate,
    });
  };

  const handleReplaySearch = async () => {
    if (!startDate || !endDate) return;

    await fetchReplay({
      line: selectedLine,
      startDate,
      endDate,
      st: selectedStation === "Geral" ? null : selectedStation,
      maq: null,
    });
  };

  useEffect(() => {
    if (mode === "LIVE") {
      replayController.reset();
    }
  }, [mode]);

  // useEffect(() => {
  //   if (mode === "REPLAY" && startDate && endDate) {
  //     fetchReplay({
  //       line: selectedLine,
  //       startDate,
  //       endDate,
  //       st: selectedStation === "Geral" ? null : selectedStation,
  //       maq: null,
  //     });
  //   }
  // }, [mode, selectedLine, selectedStation]);

  console.log("TODOS: ", replayData);
  const generateCycleTimeGraphs = () => {
    const stations = dicMaq[selectedLine] || {};

    //  GERAL → todas STs
    if (selectedStation === "Geral") {
      return Object.keys(stations).map((station) => {
        const firstSubStation = stations[station][0];

        const stationReplayData =
          mode === "REPLAY" ? replayData?.stations?.[station] || [] : null;

        return (
          <CycleTimeGraph
            key={`${selectedLine}-${station}-${firstSubStation}`}
            linestation={`${selectedLine}${station}${firstSubStation}`}
            line={selectedLine}
            maq={firstSubStation}
            mode={mode}
            replayData={stationReplayData} // ✅ FILTRADO
            currentTimestamps={replayController.currentTimestamps} // ✅ corrigido
            goNext={replayController.goNext}
            goPrev={replayController.goPrev}
            currentPage={replayController.currentPage}
            totalPages={replayController.totalPages}
          />
        );
      });
    }

    //  ST específica
    const selectedStationData = stations[selectedStation] || [];

    return selectedStationData.map((maq) => {
      const stationReplayData =
        mode === "REPLAY"
          ? replayData?.stations?.[selectedStation] || []
          : null;

      return (
        <CycleTimeGraph
          key={`${selectedLine}-${selectedStation}-${maq}`}
          linestation={`${selectedLine}${selectedStation}${maq}`}
          line={selectedLine}
          maq={maq}
          mode={mode}
          replayData={stationReplayData} // ✅ FILTRADO
          currentTimestamps={replayController.currentTimestamps} // ✅ corrigido
          goNext={replayController.goNext}
          goPrev={replayController.goPrev}
          currentPage={replayController.currentPage}
          totalPages={replayController.totalPages}
        />
      );
    });
  };

  const hasReplayData =
    mode === "REPLAY" &&
    replayData?.stations &&
    Object.values(replayData.stations).some(
      (stationArray) => stationArray && stationArray.length > 0,
    );

  return (
    <div className="cycletime">
      <div className="cycletime__header">
        <div className="cycletime__selectors">
          {/* Linha */}
          <div className="cycletime__selector">
            <label className="cycletime__label">Linha</label>
            <select
              value={selectedLine}
              onChange={(e) => {
                setSelectedLine(e.target.value);
                setSelectedStation("Geral");
              }}
              className="cycletime__combobox"
            >
              <option value="SCC">SCC</option>
              <option value="FSA">FSA</option>
              <option value="FDA">FDA</option>
              <option value="SCE">SCE</option>
              <option value="AUC">AUC</option>
              <option value="AUE">AUE</option>
              <option value="OFS">OFS</option>
              <option value="OFD">OFD</option>
            </select>
          </div>

          {/* Estação */}
          {mode === "LIVE" && (
            <div className="cycletime__selector">
              <label className="cycletime__label">Estação</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="cycletime__combobox"
              >
                {getStationsForLine(selectedLine).map((station) => (
                  <option key={station} value={station}>
                    {station}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* 🔹 Inputs de data só se for REPLAY */}
          {mode === "REPLAY" && (
            <>
              {/* Data de início */}
              <div className="cycletime__selector">
                <label className="cycletime__label">Início</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="cycletime__combobox"
                />
              </div>

              {/* Data de fim */}
              <div className="cycletime__selector">
                <label className="cycletime__label">Fim</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="cycletime__combobox"
                />
              </div>

              {/* Botão Buscar */}
              <div
                className="cycletime__selector"
                style={{ alignSelf: "flex-end" }}
              >
                <button
                  onClick={handleReplaySearch}
                  className="cycletime__btn-history"
                >
                  Buscar
                </button>
              </div>

              {/* Botão exportar */}
              {hasReplayData && (
                <div
                  className="cycletime__selector"
                  style={{ alignSelf: "flex-end", width: "100px" }}
                >
                  <button
                    onClick={handleExportExcel}
                    className="cycletime__btn-history"
                    s
                    style={{ width: "100px" }}
                  >
                    Exportar Excel
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="cycletime__mode-switch">
          <button
            className={mode === "LIVE" ? "active" : ""}
            onClick={() => setMode("LIVE")}
          >
            AO VIVO
          </button>

          <button
            className={mode === "REPLAY" ? "active" : ""}
            onClick={() => {
              setMode("REPLAY");
              setSelectedStation("Geral"); // 🔹 reseta a estação
            }}
          >
            REPLAY
          </button>
        </div>

        <button
          className="cycletime__btn-history"
          onClick={() => navigate(`/tempociclo/dashboard?line=${selectedLine}`)}
        >
          Histórico Completo
        </button>
      </div>

      {generateCycleTimeGraphs()}
    </div>
  );
};

export default CycleTime;
