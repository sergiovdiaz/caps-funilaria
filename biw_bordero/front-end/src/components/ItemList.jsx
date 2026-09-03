import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  socket,
  subscribeToLine,
  unsubscribeFromLine,
  listenToProductionData,
} from "../../api/api";
import { biwLinesArray } from "../assets/database/biwLines";
import AreaChart from "./AreaChart";
import { useSinopticoAndon } from "./sinopticoprodutivo/hooks/useSinopticoAndon";

const LineChart = ({ line, series }) => {
  const productivity = useSinopticoAndon(line, "productivity");

  return (
    <AreaChart
      line={line}
      series={series}
      info={{
        producaoTurno: productivity?.realizado ?? 0,
        velocidade:
          typeof productivity?.jph === "number"
            ? productivity.jph.toFixed(1)
            : "N/A",
        tempoCiclo: productivity?.tc ?? "N/A",
      }}
    />
  );
};

const ItemList = ({ title, isSideBySide, isOpen, toggleVisibility }) => {
  const [lineData, setLineData] = useState({});
  const [localIsOpen, setLocalIsOpen] = useState(true);
  const subscribedLinesRef = useRef(new Set());

  const linesInGroup = useMemo(
    () => biwLinesArray.filter((line) => line.group === title),
    [title],
  );

  const subscribeLine = useCallback((line) => {
    if (!socket.connected || subscribedLinesRef.current.has(line)) return;

    subscribedLinesRef.current.add(line);
    subscribeToLine(line);

    listenToProductionData(line, (payload) => {
      if (!payload?.series?.length) return;

      const apexSeries = payload.series.map((s) => ({
        name: s.name,
        data: s.data.map((p) => ({
          x: p.ts,
          y: p.value,
        })),
      }));

      setLineData((prev) => ({
        ...prev,
        [line]: apexSeries,
      }));
    });
  }, []);

  useEffect(() => {
    if (socket.connected) {
      linesInGroup.forEach((l) => subscribeLine(l.line));
    } else {
      socket.once("connect", () => {
        linesInGroup.forEach((l) => subscribeLine(l.line));
      });
    }

    return () => {
      linesInGroup.forEach((l) => {
        if (subscribedLinesRef.current.has(l.line)) {
          unsubscribeFromLine(l.line);
          subscribedLinesRef.current.delete(l.line);
        }
      });
    };
  }, [linesInGroup, subscribeLine]);

  const toggleLocalVisibility = () => setLocalIsOpen((prev) => !prev);

  const isVisible = isSideBySide ? isOpen : localIsOpen;

  return (
    <div className="item-list">
      <div
        className="item-list__header"
        onClick={isSideBySide ? toggleVisibility : toggleLocalVisibility}
        style={{ cursor: "pointer" }}
      >
        <div className="item-list__header-icon">
          {isVisible ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
        </div>
        <h2 style={{ display: "inline", marginLeft: 8 }}>{title}</h2>
      </div>

      {isVisible && (
        <div className="item-list__charts">
          {linesInGroup.map((line) => (
            <LineChart
              key={line.line}
              line={line.line}
              series={lineData[line.line] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemList;
