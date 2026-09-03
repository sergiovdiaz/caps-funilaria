import React, { useEffect, useRef } from "react";
import { formatMinutesToHHMMSS } from "../../utils/capUtils";

// ================= HOOK DESENHAR LINHAS =================
export const useDrawLines = (ref, deps = []) => {
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const svg = container.querySelector("svg");
    if (!svg) return;

    svg.innerHTML = "";

    const center = container.querySelector(".tree-card--current");
    const ups = container.querySelectorAll(".tree-relations--up .tree-node");
    const downs = container.querySelectorAll(".tree-relations--down .tree-node");

    if (!center) return;

    const containerRect = container.getBoundingClientRect();

    const getPos = (el) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
      };
    };

    const drawLine = (from, to) => {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      line.setAttribute("stroke", "#90CAF9");
      line.setAttribute("stroke-width", "2");

      svg.appendChild(line);
    };

    const centerPos = getPos(center);

    ups.forEach((el) => drawLine(getPos(el), centerPos));
    downs.forEach((el) => drawLine(centerPos, getPos(el)));
  }, deps);
};