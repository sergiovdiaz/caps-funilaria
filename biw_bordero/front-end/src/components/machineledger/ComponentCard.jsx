import { useState } from "react";
import { C } from "./data/theme.js";
import { TecBadge } from "./ui/UI.jsx";
import { Icon } from "./ui/Icon.jsx";
import { useEffect } from "react";
import { CodeBadge } from "./ui/UI.jsx";

// ─── STOCK STATUS ─────────────────────────────────────────────────────────────
const getStockStatus = (atual, minimo) => {
  if (atual === 0)
    return {
      color: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
      label: "Sem estoque",
      icon: "✕",
    };
  if (atual < minimo)
    return {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      label: "Baixo",
      icon: "▲",
    };
  return {
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    label: "OK",
    icon: "✓",
  };
};

// ─── STOCK PANEL ──────────────────────────────────────────────────────────────
const StockPanel = ({ dados }) => {
  if (!dados) return null;
  const { unidadeMedida, min, atual, custoUnitario, localizacao } = dados;
  const status = getStockStatus(atual, min);
  const fmt = (n) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

  return (
    <div
      style={{
        marginTop: 8,
        borderTop: `1px solid rgba(0,0,0,0.06)`,
        paddingTop: 8,
      }}
    >
      {/* header linha única */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            fontFamily: C.font,
            fontWeight: 600,
          }}
        >
          Estoque
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: status.color,
            background: status.bg,
            borderRadius: 20,
            padding: "1px 7px",
            fontFamily: C.font,
            border: `1px solid ${status.color}33`,
            letterSpacing: 0.3,
          }}
        >
          {status.icon} {status.label}
        </span>
      </div>

      {/* métricas em linha única */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StockMetric
          label="Atual"
          value={`${atual} ${unidadeMedida}`}
          bold
          color={status.color}
        />
        <StockMetric label="Mínimo" value={`${min} ${unidadeMedida}`} />
        <StockMetric label="Custo unit." value={fmt(custoUnitario)} />
        {localizacao && <StockMetric label="Local" value={localizacao} mono />}
      </div>
    </div>
  );
};

const StockMetric = ({ label, value, bold, color, mono }) => (
  <div>
    <div
      style={{
        fontSize: 9,
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: 0.7,
        fontFamily: C.font,
        marginBottom: 1,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: mono ? 11 : 12,
        fontFamily: mono ? "monospace" : C.font,
        fontWeight: bold ? 700 : 500,
        color: color ?? C.dark,
        letterSpacing: mono ? 0.5 : 0,
      }}
    >
      {value}
    </div>
  </div>
);

// ─── ADD TO CART CONTROL ──────────────────────────────────────────────────────
const AddToCartControl = ({
  item,
  onAddToCart,
  onRemoveFromCart,
  inCart,
  cartQty,
  unit,
}) => {
  const [qty, setQty] = useState(cartQty || 1);
  const [addedFlash, setAddedFlash] = useState(false);
  // console.log(cartQty);
  // 🔁 sincroniza com carrinho
  useEffect(() => {
    if (cartQty > 0) {
      setQty(cartQty);
    } else {
      setQty(1);
    }
  }, [cartQty]);

  const confirm = (e) => {
    e.stopPropagation();

    const delta = qty - cartQty;

    if (delta > 0) {
      onAddToCart(item, delta);
    } else if (delta < 0) {
      onRemoveFromCart(item, Math.abs(delta));
    }

    // feedback visual
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 500);
  };

  const step = (e, delta) => {
    e.stopPropagation();
    setQty((q) => Math.max(1, q + delta));
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: C.surface,
        border: `1px solid ${inCart ? C.green : C.accent}`,
        borderRadius: 6,
        padding: "3px 5px",
      }}
    >
      {/* − */}
      <button onClick={(e) => step(e, -1)} style={sBtn()}>
        −
      </button>

      {/* input */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && n >= 1) setQty(n);
          }}
          style={{
            width: 34,
            height: 22,
            textAlign: "center",
            border: "none",
            background: "transparent",
            color: C.dark,
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: 700,
            outline: "none",
          }}
        />
        {unit && <span style={{ fontSize: 9, color: C.muted }}>{unit}</span>}
      </div>

      {/* + */}
      <button onClick={(e) => step(e, 1)} style={sBtn()}>
        +
      </button>

      {/* divider */}
      <div
        style={{
          width: 1,
          height: 16,
          background: C.border,
          margin: "0 2px",
        }}
      />

      {/* botão principal */}
      <button
        onClick={confirm}
        style={{
          background: inCart ? C.green : C.accent,
          border: "none",
          borderRadius: 5,
          padding: "3px 9px",
          color: "#fff",
          width: "112px",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          transform: addedFlash ? "scale(1.08)" : "scale(1)",
          transition: "all 0.15s",
        }}
      >
        {inCart
          ? qty === cartQty
            ? `No carrinho (${cartQty})`
            : `Atualizar (${cartQty} → ${qty})`
          : "Adicionar"}
      </button>
    </div>
  );
};
const sBtn = () => ({
  background: "none",
  border: "none",
  borderRadius: 4,
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: C.muted,
  fontSize: 14,
  lineHeight: 1,
  transition: "all 0.12s",
});

// ─── COMPONENT CARD ───────────────────────────────────────────────────────────
export const ComponentCard = ({
  item,
  highlight = false,
  onAddToCart,
  onRemoveFromCart,
  cartItems = [],
}) => {
  const [copied, setCopied] = useState(null);

  const copy = async (value, key) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        // fallback
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  const codigoSap = item.estoque?.codigoSap ?? item.id;
  const unidade = item.estoque?.unidadeMedida ?? "";

  const cartQty = cartItems
    .filter((c) => (c.estoque?.codigoSap ?? c.id) === codigoSap)
    .reduce((sum, c) => sum + (c.quantity ?? 0), 0);

  const inCart = cartQty > 0;
  // console.log(item);
  return (
    <div
      style={{
        background: C.card,
        border: `1.5px solid ${highlight ? C.accent : C.borderLt}`,
        borderRadius: 10,
        padding: "11px 14px",
        boxShadow: highlight ? C.shadow : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {/* ── CABEÇALHO ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 6,
        }}
      >
        {/* esquerda: nome + fabricante + tech */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: C.dark,
                fontFamily: C.font,
                lineHeight: 1.3,
              }}
            >
              {item.label}
            </span>
            {item.fabricante && (
              <>
                <span
                  style={{ color: C.gray300, fontSize: 11, fontWeight: 800 }}
                >
                  ·
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.accentDk,
                    fontFamily: C.font,
                  }}
                >
                  {item.fabricante}
                </span>
              </>
            )}
            {item.tecnologia && <TecBadge value={item.tecnologia} small />}
          </div>
          {item.caracTecnicas && (
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                fontFamily: C.font,
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {item.caracTecnicas}
            </div>
          )}
          {item.meta?.mMaquina && (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                fontFamily: C.font,
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>🔧</span>
              <span style={{ fontWeight: 600, color: C.accent }}>
                {item.meta.maquina}
              </span>
              <span style={{ opacity: 0.6 }}>({item.meta.mMaquina})</span>
            </div>
          )}
        </div>
      </div>

      {/* ── RODAPÉ: SAP + CESTA ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {codigoSap && (
          <CodeBadge
            label="Cód. SAP"
            value={codigoSap}
            colorKey="green"
            copied={copied}
            onCopy={copy}
          />
        )}
        {onAddToCart && (
          <AddToCartControl
            item={item}
            onAddToCart={onAddToCart}
            onRemoveFromCart={onRemoveFromCart}
            inCart={inCart}
            cartQty={cartQty}
            unit={unidade}
          />
        )}
      </div>

      {/* ── ESTOQUE ────────────────────────────────────────────────────── */}
      <StockPanel dados={item.estoque} />
    </div>
  );
};

export default ComponentCard;
