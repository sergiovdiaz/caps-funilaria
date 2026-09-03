import React, { useRef, useEffect, useState, useCallback } from "react";
import { formatMinutesToHHMMSS } from "../../utils/capUtils";
// ─── Card de Nó ──────────────────────────────────────────────────────────────
const NodeCard = React.forwardRef(({ node, isCurrent = false }, ref) => {
  const level = node?.nivel ?? 0;
  const cls = isCurrent
    ? "tree-card tree-card--current"
    : `tree-card tree-card--rel tree-card--level-${level}`;

  return (
    <div className={cls} ref={ref} data-id={node.id}>
      <div className="tree-card__header">
        <span className="tree-card__linha">{node.linha}</span>
        {isCurrent && <span className="tree-card__tag">Esta parada</span>}
        <span className="tree-card__duracao">
          {formatMinutesToHHMMSS(node.duracao)}
        </span>
      </div>
      <div className="tree-card__maquina">{node.maquina}</div>
      <div className="tree-card__body">
        {node.causaRaiz && (
          <div className="tree-card__row">
            <span className="tree-card__label">Causa raiz:</span>
            <span className="tree-card__value">{node.causaRaiz}</span>
          </div>
        )}
        {node.modoFalha && node.modoFalha !== "NÃO SE APLICA" && (
          <div className="tree-card__row">
            <span className="tree-card__label">Modo de falha:</span>
            <span className="tree-card__value">{node.modoFalha}</span>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Seta Curva SVG ──────────────────────────────────────────────────────────
const CurvedArrow = ({ x1, y1, x2, y2, type }) => {
  const dy = Math.abs(y2 - y1);
  const curve = Math.min(dy * 0.5, 60);
  const d = `M ${x1} ${y1} C ${x1} ${y1 + (y2 > y1 ? curve : -curve)}, ${x2} ${y2 - (y2 > y1 ? curve : -curve)}, ${x2} ${y2}`;

  const color = type === "up" ? "#ef4444" : "#3b82f6";
  const arrowId = `arrow-${type}-${Math.round(x1)}-${Math.round(y1)}`;

  return (
    <g>
      <defs>
        <marker
          id={arrowId}
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 Z" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        markerEnd={`url(#${arrowId})`}
        opacity="0.6"
      />
    </g>
  );
};

// ─── Hook de Conexões (Lógica por IDs) ───────────────────────────────────────
function useConnectorLines(wrapperRef, nodeRefs, edges) {
  const [lines, setLines] = useState([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  const recalc = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !nodeRefs.current) return;

    const wRect = wrapper.getBoundingClientRect();
    setSvgSize({ w: wrapper.offsetWidth, h: wrapper.offsetHeight });

    const getPos = (el, direcao, isFrom) => {
      const r = el.getBoundingClientRect();
      const midX = r.left - wRect.left + r.width / 2;
      // Se for origem (from) e direção UP, sai pelo topo. Se for efeito (DOWN), sai pela base.
      const y =
        (isFrom && direcao === "UP") || (!isFrom && direcao === "DOWN")
          ? r.top - wRect.top
          : r.bottom - wRect.top;
      return { x: midX, y };
    };

    const newLines = edges
      .map((edge) => {
        const fromEl = nodeRefs.current.get(edge.from);
        const toEl = nodeRefs.current.get(edge.to);
        if (!fromEl || !toEl) return null;

        const fromPos = getPos(fromEl, edge.direcao, true);
        const toPos = getPos(toEl, edge.direcao, false);

        return {
          id: `line-${edge.from}-${edge.to}`,
          x1: fromPos.x,
          y1: fromPos.y,
          x2: toPos.x,
          y2: toPos.y,
          type: edge.direcao.toLowerCase(),
        };
      })
      .filter(Boolean);

    setLines(newLines);
  }, [edges, nodeRefs, wrapperRef]);

  useEffect(() => {
    const observer = new ResizeObserver(recalc);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    const t = setTimeout(recalc, 100);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, [recalc]);

  return { lines, svgSize };
}

// ─── Componente Principal ────────────────────────────────────────────────────
const RelacaoTree = ({ justificativa }) => {
  const nodeRefs = useRef(new Map());
  const wrapperRef = useRef(null);

  if (!justificativa?.grafo) return null;

  const { nodes, edges } = justificativa.grafo;
  const baseId = Number(justificativa.id);

  // 1. Mapear níveis (Simulação de árvore simples baseada nos edges)
  // Nota: Idealmente seu backend já deve enviar o "nivel" calculado
  const nodesWithLevel = nodes.map((node) => {
    const edgeAsTarget = edges.find((e) => e.to === node.id);
    const edgeAsSource = edges.find((e) => e.from === node.id);

    let nivel = 0;
    if (edgeAsTarget && edgeAsTarget.direcao === "UP") nivel = -1;
    if (edgeAsTarget && edgeAsTarget.direcao === "DOWN") nivel = 1;
    // ... lógica de expansão de níveis conforme sua necessidade
    return { ...node, nivel: node.id === baseId ? 0 : node.nivel || nivel };
  });

  const levels = [...new Set(nodesWithLevel.map((n) => n.nivel))].sort(
    (a, b) => a - b,
  );
  const { lines, svgSize } = useConnectorLines(wrapperRef, nodeRefs, edges);

  return (
    <div className="relacao-container">
      <h3 className="validation-section-title">Fluxo de Causa e Efeito</h3>

      <div
        className="relacao-graph"
        ref={wrapperRef}
        style={{ position: "relative" }}
      >
        <svg
          className="relacao-graph__svg"
          width={svgSize.w}
          height={svgSize.h}
          style={{ position: "absolute", pointerEvents: "none" }}
        >
          {lines.map((l) => (
            <CurvedArrow key={l.id} {...l} />
          ))}
        </svg>

        {levels.map((level) => (
          <div key={level} className="relacao-graph__level">
            <div className="relacao-graph__level-label">
              {level < 0
                ? "Causas Originais"
                : level > 0
                  ? "Impactos Gerados"
                  : "Parada Principal"}
            </div>
            <div className="relacao-graph__row">
              {nodesWithLevel
                .filter((n) => n.nivel === level)
                .map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    isCurrent={node.id === baseId}
                    ref={(el) =>
                      el
                        ? nodeRefs.current.set(node.id, el)
                        : nodeRefs.current.delete(node.id)
                    }
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelacaoTree;
