/**
 * StepCard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Card de navegação hierárquica do MachineLedger.
 *
 * Props:
 *   title        — texto principal (string)
 *   subtitle     — texto secundário opcional (string)
 *   type         — "ute" | "linha" | "operacao" | "tipoMaquina" | "maquina"
 *
 *   // Para type="tipoMaquina" e type="maquina":
 *   tipoId       — id curto do tipo (ex: "VL"), exibido como badge monospace
 *   tipoLabel    — descrição completa do tipo (ex: "Versa Lifter - Transp. Carr")
 *
 *   count        — número principal de itens filhos
 *   countType    — label do count (ex: "maquinas", "componentes")
 *   subCount     — número secundário (só tipoMaquina)
 *   subCountType — label do subCount (ex: "componentes")
 *
 *   width        — largura do card em px (default: 140)
 *   onClick      — callback de seleção
 *
 * Regras visuais:
 *   - ute / linha / operacao  → título centralizado, sem thumbnail
 *   - tipoMaquina             → thumbnail + badge (tipoId) + descrição + contadores
 *   - maquina                 → thumbnail + badge de tipo no topo + contadores
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NavCard, MachineThumbnail, CountBadge } from "./ui/UI";
import { C } from "./data/theme";

export const StepCard = ({
  title,
  subtitle,
  type = "default",

  tipoId, // substitui tipoCodigo — vem de TipoMaquina.id
  tipoLabel, // substitui tipoDesc   — vem de TipoMaquina.label

  count,
  countType,
  subCount,
  subCountType,

  width = 140,
  onClick,
}) => {
  const isCentered = type === "ute" || type === "linha" || type === "operacao";
  const showThumbnail = type === "tipoMaquina" || type === "maquina";

  // Badge monospace com o id curto do tipo (só quando disponível)
  const showTipoBadge =
    (type === "tipoMaquina" || type === "maquina") && tipoId;

  // Prefixo "UTE " apenas para o nível UTE
  const displayTitle = type === "ute" ? `${title}` : title;

  return (
    <NavCard onClick={onClick} width={width}>
      {/* ── Thumbnail (tipoMaquina e maquina) ─────────────────────────────── */}
      {showThumbnail && <MachineThumbnail tipoId={tipoId} />}

      {/* ── Badge do tipo (id curto) ──────────────────────────────────────── */}
      {showTipoBadge && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
            background: C.accentMut,
            border: `1px solid ${C.accentLo}`,
            borderRadius: 6,
            padding: "2px 8px",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              color: C.accent,
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            {tipoId}
          </span>
          {/* Mostra o label junto no badge apenas para maquina */}
          {type === "maquina" && tipoLabel && (
            <span style={{ color: C.dark, fontSize: 12 }}>{tipoLabel}</span>
          )}
        </div>
      )}

      {/* ── Título principal ──────────────────────────────────────────────── */}
      <div
        style={{
          fontSize: type === "linha" || type === "ute" ? 24 : 20,
          fontWeight: 700,
          color: C.accent,
          textAlign: isCentered ? "center" : "left",
          marginBottom: 4,
        }}
      >
        {displayTitle}
      </div>

      {/* ── Descrição (tipoLabel para tipoMaquina, ou subtitle genérico) ──── */}
      {(subtitle || tipoLabel) && type !== "maquina" && (
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: C.dark,
            marginBottom: 10,
            lineHeight: 1.4,
            textAlign: isCentered ? "center" : "left",
          }}
        >
          {subtitle || tipoLabel}
        </div>
      )}

      {/* ── Contadores ────────────────────────────────────────────────────── */}
      {(count !== undefined || subCount !== undefined) && (
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: isCentered ? "center" : "flex-start",
          }}
        >
          {count !== undefined && countType && (
            <CountBadge count={count} label={countType} variant="accent" />
          )}
          {subCount !== undefined && subCountType && (
            <CountBadge count={subCount} label={subCountType} variant="muted" />
          )}
        </div>
      )}
    </NavCard>
  );
};
