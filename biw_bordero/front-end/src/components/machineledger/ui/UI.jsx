import { C } from "../data/theme.js";
import { Icon } from "./Icon.jsx";
import { MACHINE_IMAGES } from "../utils/machineImages.js";

// ─── BREADCRUMB ───────────────────────────────────────────────────────────────
export const Breadcrumb = ({ steps }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 24,
    }}
  >
    {steps.map((s, i) => (
      <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {i > 0 && <span style={{ color: C.muted, fontSize: 14 }}>›</span>}
        <button
          onClick={() => s.onClick?.()}
          disabled={!s.onClick}
          style={{
            background: "none",
            border: "none",
            cursor: s.onClick ? "pointer" : "default",
            color: s.onClick ? C.accent : C.dark,
            fontSize: 13,
            fontFamily: C.font,
            padding: "2px 4px",
            borderRadius: 4,
            fontWeight: s.onClick ? 400 : 600,
            textDecorationLine: s.onClick ? "underline" : "none",
            textDecorationColor: C.accentLo,
            textDecorationThickness: "1px",
            textDecorationStyle: "solid",
          }}
        >
          {s.label}
        </button>
      </span>
    ))}
  </div>
);

// ─── CHIP ─────────────────────────────────────────────────────────────────────
export const Chip = ({ label, count, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? C.accent : C.card,
      border: `1.5px solid ${active ? C.accent : C.border}`,
      color: active ? "#ffffff" : C.dark,
      borderRadius: 8,
      padding: "7px 14px",
      cursor: "pointer",
      fontFamily: C.font,
      fontSize: 12,
      fontWeight: active ? 700 : 400,
      display: "flex",
      alignItems: "center",
      gap: 7,
      transition: "all 0.15s",
    }}
  >
    {label}
    {count !== undefined && (
      <span
        style={{
          background: active ? "rgba(255,255,255,0.25)" : C.gray200,
          color: active ? "#fff" : C.muted,
          borderRadius: 10,
          padding: "1px 7px",
          fontSize: 11,
        }}
      >
        {count}
      </span>
    )}
  </button>
);

// ─── BADGE TECNOLOGIA ─────────────────────────────────────────────────────────
export const TecBadge = ({ value, small = false }) => {
  const isElet = value === "ELÉTRICA";
  const iconName = isElet ? "elet" : "mec";

  return (
    <span
      style={{
        fontSize: small ? 10 : 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        padding: small ? "2px 7px" : "3px 10px",
        borderRadius: 20,
        background: isElet ? C.accentMut : C.amberLo,
        color: isElet ? C.accent : C.amber,
        border: `1px solid ${isElet ? C.accentLo : C.amberBdr}`,
        whiteSpace: "nowrap",
        fontFamily: C.font,
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <Icon name={iconName} size={small ? 12 : 14} />
      {isElet ? "ELÉTRICA" : "MECÂNICA"}
    </span>
  );
};
// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder }) => (
  <div style={{ position: "relative", maxWidth: 440 }}>
    {/* Ícone de busca à esquerda */}
    <div
      style={{
        position: "absolute",
        left: 10,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none", // não interfere no clique do input
      }}
    >
      <Icon name="search" size={16} color={C.accent} />
    </div>

    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={
        placeholder ?? "Buscar componente, código SAP, fabricante..."
      }
      style={{
        width: "100%",
        background: C.card,
        border: `1.5px solid ${value ? C.accent : C.border}`,
        borderRadius: 8,
        padding: "10px 36px 10px 38px", // deixa espaço para o ícone
        color: C.dark,
        fontSize: 14,
        fontFamily: C.font,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
      }}
    />

    {/* Botão de limpar */}
    {value && (
      <button
        onClick={() => onChange("")}
        style={{
          position: "absolute",
          right: 11,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: C.muted,
          cursor: "pointer",
          fontSize: 15,
          display: "flex",
          alignItems: "center",
        }}
      >
        ✕
      </button>
    )}
  </div>
);

// ─── NAV CARD — card clicável usado nos níveis 1-4 ───────────────────────────
export const NavCard = ({ onClick, children, width = 220 }) => (
  <button
    onClick={onClick}
    style={{
      background: C.card,
      border: `1.5px solid ${C.border}`,
      borderRadius: 12,
      padding: 20,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: C.font,
      width,
      transition: "all 0.2s",
      boxShadow: C.shadow,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = C.accent;
      e.currentTarget.style.boxShadow = C.shadowLg;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.boxShadow = C.shadow;
    }}
  >
    {children}
  </button>
);

// ─── MACHINE THUMBNAIL — placeholder enquanto não há imagem real ──────────────
export const MachineThumbnail = ({ tipoId, height = 120 }) => {
  const image = MACHINE_IMAGES[tipoId];

  return (
    <div
      style={{
        background: "#f0f3fb",
        borderRadius: 8,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        border: `1px solid ${C.borderLt}`,
        overflow: "hidden",
      }}
    >
      {image ? (
        <img
          src={image}
          alt={tipoId}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      ) : (
        <span style={{ fontSize: 32 }}>🏭</span>
      )}
    </div>
  );
};
// ─── COUNT BADGE ─────────────────────────────────────────────────────────────
export const CountBadge = ({ label, count, variant = "accent" }) => {
  const styles = {
    accent: { color: C.accent, background: C.accentMut, border: "none" },
    muted: {
      color: C.muted,
      background: C.surface,
      border: `1px solid ${C.borderLt}`,
    },
  };
  const s = styles[variant] ?? styles.accent;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        borderRadius: 6,
        padding: "3px 8px",
        ...s,
      }}
    >
      {count} {label}
    </span>
  );
};

// ─── CART FAB (botão flutuante) ───────────────────────────────────────────────

export const CartFab = ({ count, onClick }) => (
  <button
    onClick={onClick}
    title="Abrir carrinho de compras"
    style={{
      position: "fixed",
      bottom: 28,
      right: 28,
      zIndex: 200,
      width: 52,
      height: 52,
      borderRadius: "50%",
      background: C.accent,
      border: "none",
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "scale(1.08)";
      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.22)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.18)";
    }}
  >
    {/* Ícone do carrinho */}
    <Icon name="cart" size={24} color="white" />

    {count > 0 && (
      <span
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          background: "#ef4444",
          color: "#fff",
          borderRadius: "50%",
          width: 18,
          height: 18,
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: C.font,
          border: "2px solid #fff",
        }}
      >
        {count > 9 ? "9+" : count}
      </span>
    )}
  </button>
);

// ─── CODE BADGE ───────────────────────────────────────────────────────────────
export const CodeBadge = ({ label, value, colorKey, copied, onCopy }) => {
  const isGreen = colorKey === "green";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontSize: 9,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontFamily: C.font,
        }}
      >
        {label}
      </span>
      <button
        onClick={() => onCopy(value, label)}
        title={`Copiar ${label}`}
        style={{
          background: isGreen ? C.greenLo : C.accentMut,
          border: `1px solid ${isGreen ? C.green : C.accent}`,
          color: isGreen ? C.green : C.accent,
          borderRadius: 5,
          padding: "3px 9px",
          fontFamily: "monospace",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          letterSpacing: 0.5,
          transition: "opacity 0.15s",
        }}
      >
        {value}
        <span style={{ fontSize: 9, opacity: 0.6 }}>
          {copied === label ? "✓" : "⎘"}
        </span>
      </button>
    </div>
  );
};
