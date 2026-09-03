import React, { useState, useEffect, useRef, useMemo } from "react";
import { listenTCData, socket } from "../../api/api";
import "./styles/CycleTimeGraph.css";
import CycleTimeItem from "./CycleTimeItem";
import { tcTarget } from "../assets/database/tc";

const PAGE_SIZE = 10; // 🔹 máximo de carros por página

const CycleTimeGraph = ({
  linestation,
  line,
  maq,
  mode,
  replayData, // dados do replay para esta estação
  currentTimestamps, // timestamps da página atual (REPLAY)
  goNext,
  goPrev,
  currentPage,
  totalPages,
}) => {
  // console.log("replay:", replayData);
  const [dados, setDados] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [isAnimating, setIsAnimating] = useState(true);

  const previousFirstTimestamp = useRef(null);
  const animationTimeoutRef = useRef(null);
  const dataHandlerRef = useRef(null);
  // console.log("CURRENT: ", currentTimestamps);

  /*
  =========================
  🔥 LIVE MODE (Socket)
  =========================
  */
  useEffect(() => {
    if (mode !== "LIVE") return;

    dataHandlerRef.current = (newData) => {
      const newFirstTimestamp = newData.dados?.[0]?._timestamp;

      if (
        previousFirstTimestamp.current !== null &&
        newFirstTimestamp !== previousFirstTimestamp.current
      ) {
        setIsAnimating(true);
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, 600);
      }

      previousFirstTimestamp.current = newFirstTimestamp;

      // 🔹 Debug: mostrar quantos itens chegaram
      // console.log("📦 Número de itens recebidos:", newData.dados?.length);

      setDados(newData.dados || []);
      setAnalytics(newData.analytics || {});
    };

    socket.emit("subscribetcdata", linestation);
    listenTCData(linestation, dataHandlerRef.current);

    return () => {
      clearTimeout(animationTimeoutRef.current);
      socket.off(`tcdata/${linestation}`, dataHandlerRef.current);
      socket.emit("unsubscribetcdata", linestation);
    };
  }, [linestation, mode]);

  /*
  =========================
  REPLAY MODE
  =========================
  */
  const replayFilteredData = useMemo(() => {
    if (mode !== "REPLAY") return [];
    if (!Array.isArray(replayData) || !currentTimestamps) return [];

    // 🔹 filtra apenas os carros da página atual
    return replayData.filter((d) => currentTimestamps.includes(d._timestamp));
  }, [mode, replayData, currentTimestamps]);

  const displayedData = mode === "LIVE" ? dados : replayFilteredData;

  /*
  =========================
  🎨 RENDER
  =========================
  */
  return (
    <div className="cycletimegraph">
      <div className="cycletimegraph__header">
        <h2>{maq === "ST" ? linestation.slice(0, -2) : maq}</h2>

        {mode === "REPLAY" && totalPages > 0 && (
          <div className="cycletimegraph__pagination">
            <div className="cycletimegraph__period">
              {new Date(currentTimestamps[0]).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" – "}
              {new Date(
                currentTimestamps[currentTimestamps.length - 1],
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <button disabled={currentPage === 0} onClick={goPrev}>
              ◀
            </button>

            <span>
              {currentPage + 1} / {totalPages}
            </span>

            <button disabled={currentPage >= totalPages - 1} onClick={goNext}>
              ▶
            </button>
          </div>
        )}
      </div>

      <div className="cycletimegraph__content">
        {mode === "LIVE" && Object.keys(analytics).length > 0 && (
          <div className="cycletimegraph__analytics">
            <h3>
              <span className="first-line">Estatística</span>
              <span className="second-line">últimos 500 carros</span>
            </h3>

            <table>
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Moda</th>
                  <th>Qtd. Moda</th>
                  <th>Mediana</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics).map(([modelo, data]) => {
                  const target = tcTarget[line];
                  const isAboveTarget = target && data.moda > target;

                  return (
                    <tr
                      key={modelo}
                      className={
                        isAboveTarget
                          ? "cycletimegraph__row-alert"
                          : "cycletimegraph__row-normal"
                      }
                    >
                      <td>{modelo}</td>
                      <td>{data.moda}</td>
                      <td>{data.qtdModa}</td>
                      <td>{data.mediana}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {displayedData.length > 0 ? (
          <div
            className={`cycletime-container ${isAnimating ? "animating" : ""}`}
          >
            {(mode === "LIVE"
              ? [...displayedData].reverse()
              : displayedData
            ).map((item, index) => (
              <div
                key={`${item._timestamp}-${index}`}
                className="cycletime-item-wrapper"
              >
                <CycleTimeItem
                  dados={mode === "LIVE" ? item._r?.[0] : item}
                  line={line}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="cycletime-item-loading">
            {mode === "LIVE" ? "Carregando dados..." : "Sem dados no replay"}
          </p>
        )}
      </div>
    </div>
  );
};

export default CycleTimeGraph;
