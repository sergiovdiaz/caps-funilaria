/**
 * ComponentesList.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Lista de componentes de uma máquina com filtros encadeados.
 *
 * Recebe `items` como Componente[] (modelo de domínio pós-mapper):
 *   { id, label, fabricante, tecnologia, meta, estoque }
 *
 * Filtros disponíveis:
 *   1. Tecnologia  — chip toggle (ELÉTRICA / MECÂNICA / etc.)
 *   2. Componente  — dropdown com busca pelo `label`
 *   3. Busca livre — via prop `searchQuery` (filtra id, label, fabricante,
 *                    estoque.codigoSap)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from "react";
import { C } from "./data/theme.js";
import { Chip, TecBadge } from "./ui/UI.jsx";
import ComponentCard from "./ComponentCard";
import MachineView from "./MachineView";
import { Icon } from "./ui/Icon.jsx";

// Importa as áreas específicas da máquina (se houver)
import hepAreas from "../../assets/images/machine-ledger/HEP01.json";

// Mapeamento de áreas por máquina
const MACHINE_AREAS = {
  HEP01: hepAreas.areas, // Se o JSON tiver um array 'areas'
  // Adicione outras máquinas conforme necessário
};

const unique = (arr) => [...new Set(arr)];

// ─────────────────────────────────────────────────────────────────────────────

const ComponentesList = ({
  items = [],
  machineId,
  tipoMaquina,
  searchQuery = "",
  filterComponente = null,
  onAddToCart,
  onRemoveFromCart,
  cartItems = [],
}) => {
  const [selTec, setSelTec] = useState(null);
  const [selLabel, setSelLabel] = useState(null);
  const [labelOpen, setLabelOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (filterComponente) {
      const exists = items.some((item) => item.label === filterComponente);
      if (exists) {
        setSelLabel(filterComponente);
      }
    }
  }, [filterComponente, items]);

  // ── opções de filtro derivadas dos dados ─────────────────────────────────
  const tecOptions = unique(
    items.map((i) => i.tecnologia).filter(Boolean),
  ).sort();

  // ── pipeline de filtragem encadeada ──────────────────────────────────────
  const byTec = selTec ? items.filter((i) => i.tecnologia === selTec) : items;

  const labelOptions = unique(byTec.map((i) => i.label).filter(Boolean)).sort();

  const byLabel = selLabel ? byTec.filter((i) => i.label === selLabel) : byTec;

  // Busca livre
  const q = searchQuery.toLowerCase();
  const filteredItems = q
    ? byLabel.filter(
        (i) =>
          i.id?.toString().toLowerCase().includes(q) ||
          i.label?.toLowerCase().includes(q) ||
          i.fabricante?.toLowerCase().includes(q) ||
          i.estoque?.codigoSap?.toString().toLowerCase().includes(q),
      )
    : byLabel;

  const activeFilters = [selTec, selLabel].filter(Boolean).length;

  // Limpa label se saiu do escopo dos dados filtrados
  useEffect(() => {
    if (selLabel && !labelOptions.includes(selLabel)) setSelLabel(null);
    setLabelSearch("");
  }, [selTec]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLabelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── handlers ─────────────────────────────────────────────────────────────
  const clearAll = () => {
    setSelTec(null);
    setSelLabel(null);
  };

  // Pega as áreas da máquina atual (se existirem)
  const machineAreas = MACHINE_AREAS[tipoMaquina?.id] || [];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {/* ════════ PAINEL ESQUERDO — FILTROS ════════ */}
      <div
        style={{
          minWidth: 400,
          flex: "0 0 300px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* ── Visualização da máquina ─────────────────────────────────────── */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MachineView
              machineId={tipoMaquina?.codTipoMaquina || tipoMaquina?.id}
              machineLabel={machineId}
              areas={machineAreas}
              // Se quiser suporte a seleção de áreas, descomente:
              // selectedArea={selectedArea}
              // onAreaClick={setSelectedArea}
            />
          </div>
        </section>

        <Divider />

        {/* ── Tecnologia + Componente ─────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* FILTRO TECNOLOGIA */}
          <section style={{ flex: "0 0 auto" }}>
            <SectionLabel>Tecnologia</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Chip
                label="Todas"
                active={!selTec}
                onClick={() => {
                  setSelTec(null);
                  setSelLabel(null);
                }}
                count={items.length}
              />
              {tecOptions.map((tec) => {
                const isElet = tec === "ELÉTRICA";
                const isActive = selTec === tec;
                return (
                  <button
                    key={tec}
                    onClick={() => {
                      setSelTec(isActive ? null : tec);
                      setSelLabel(null);
                    }}
                    style={{
                      background: isActive
                        ? isElet
                          ? C.accentMut
                          : C.amberLo
                        : C.card,
                      border: `1.5px solid ${isActive ? (isElet ? C.accent : C.amberBdr) : C.border}`,
                      color: isActive ? (isElet ? C.accent : C.amber) : C.dark,
                      borderRadius: 8,
                      padding: "7px 13px",
                      cursor: "pointer",
                      fontFamily: C.font,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 400,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Icon
                      name={isElet ? "elet" : "mec"}
                      size={14}
                      color={
                        isActive
                          ? isElet
                            ? C.accent
                            : C.amber
                          : "rgba(0,0,0,0.85)"
                      }
                    />
                    {tec}
                    <span
                      style={{
                        background: "rgba(0,0,0,0.07)",
                        borderRadius: 10,
                        padding: "1px 7px",
                        fontSize: 11,
                      }}
                    >
                      {items.filter((i) => i.tecnologia === tec).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* DIVISOR VERTICAL */}
          <div
            style={{
              width: 1,
              background: C.borderLt,
              alignSelf: "stretch",
              flexShrink: 0,
            }}
          />

          {/* FILTRO COMPONENTE (dropdown com busca) */}
          <section style={{ flex: 1, minWidth: 0 }}>
            <SectionLabel>Material</SectionLabel>
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setLabelOpen((o) => !o)}
                style={{
                  width: "100%",
                  background: C.card,
                  border: `1.5px solid ${selLabel ? C.accent : C.border}`,
                  borderRadius: 8,
                  padding: "9px 14px",
                  cursor: "pointer",
                  fontFamily: C.font,
                  fontSize: 13,
                  color: selLabel ? C.accent : C.dark,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  transition: "border-color 0.15s",
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "left",
                  }}
                >
                  {selLabel || "Todos os materiais"}
                </span>
                <span style={{ flexShrink: 0, color: C.muted, fontSize: 10 }}>
                  {labelOpen ? "▲" : "▼"}
                </span>
              </button>

              {labelOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    background: C.card,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    boxShadow: C.shadowLg,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      borderBottom: `1px solid ${C.borderLt}`,
                    }}
                  >
                    <input
                      autoFocus
                      placeholder="Buscar material..."
                      value={labelSearch}
                      onChange={(e) => setLabelSearch(e.target.value)}
                      style={{
                        width: "100%",
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: "6px 10px",
                        fontFamily: C.font,
                        fontSize: 12,
                        color: C.dark,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ maxHeight: 180, overflowY: "auto" }}>
                    <DropdownItem
                      onClick={() => {
                        setSelLabel(null);
                        setLabelOpen(false);
                        setLabelSearch("");
                      }}
                      active={!selLabel}
                    >
                      Todos os materiais
                    </DropdownItem>

                    {labelOptions
                      .filter((l) =>
                        l.toLowerCase().includes(labelSearch.toLowerCase()),
                      )
                      .map((label) => (
                        <DropdownItem
                          key={label}
                          onClick={() => {
                            setSelLabel(label);
                            setLabelOpen(false);
                            setLabelSearch("");
                          }}
                          active={selLabel === label}
                        >
                          {label}
                        </DropdownItem>
                      ))}

                    {labelOptions.filter((l) =>
                      l.toLowerCase().includes(labelSearch.toLowerCase()),
                    ).length === 0 && (
                      <div
                        style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          color: C.muted,
                          fontFamily: C.font,
                          textAlign: "center",
                        }}
                      >
                        Nenhum resultado
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selLabel && (
              <button
                onClick={() => setSelLabel(null)}
                style={{
                  marginTop: 6,
                  background: "none",
                  border: "none",
                  color: C.muted,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: C.font,
                  padding: 0,
                }}
              >
                ✕ limpar filtro
              </button>
            )}
          </section>
        </div>

        {/* ── Limpar todos ─────────────────────────────────────────────────── */}
        {activeFilters > 0 && (
          <button
            onClick={clearAll}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "8px 14px",
              color: C.muted,
              cursor: "pointer",
              fontFamily: C.font,
              fontSize: 12,
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = C.accent;
              e.currentTarget.style.borderColor = C.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.muted;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            ✕ Limpar todos os filtros ({activeFilters})
          </button>
        )}
      </div>

      {/* ════════ PAINEL DIREITO — LISTA ════════ */}
      <div
        style={{
          flex: "1 1 300px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: "85vh",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontFamily: C.font,
            }}
          >
            {filteredItems.length} componente
            {filteredItems.length !== 1 ? "s" : ""}
            {q ? ` para "${searchQuery}"` : ""}
          </span>
          {selTec && <TecBadge value={selTec} small />}
          {selLabel && (
            <span
              style={{
                fontSize: 11,
                color: C.accent,
                background: C.accentMut,
                borderRadius: 20,
                padding: "2px 10px",
                border: `1px solid ${C.accentLo}`,
                fontFamily: C.font,
              }}
            >
              {selLabel}
            </span>
          )}
        </div>

        <div
          style={{
            overflowY: "auto",
            paddingRight: 4,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                color: C.muted,
                padding: 32,
                textAlign: "center",
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.borderLt}`,
                fontFamily: C.font,
                fontSize: 13,
              }}
            >
              Nenhum material para essa combinação de filtros.
            </div>
          ) : (
            filteredItems.map((item) => (
              <ComponentCard
                key={item.id}
                item={item}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
                cartItems={cartItems}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Subcomponentes locais ────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      color: C.muted,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontWeight: 600,
      fontFamily: C.font,
    }}
  >
    {children}
  </div>
);

const Divider = () => <div style={{ borderTop: `1px solid ${C.borderLt}` }} />;

const DropdownItem = ({ onClick, active, children }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      background: active ? C.accentMut : "none",
      border: "none",
      borderBottom: `1px solid ${C.borderLt}`,
      padding: "10px 14px",
      color: active ? C.accent : C.dark,
      cursor: "pointer",
      fontFamily: C.font,
      fontSize: 13,
      textAlign: "left",
      fontWeight: active ? 600 : 400,
    }}
  >
    {children}
  </button>
);

export default ComponentesList;
