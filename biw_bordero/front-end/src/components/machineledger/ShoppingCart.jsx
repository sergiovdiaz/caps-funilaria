// ShoppingCart.jsx
import { C } from "./data/theme.js";
import { TecBadge } from "./ui/UI.jsx";
import { Icon } from "./ui/Icon.jsx";
import { useState, useMemo } from "react";
import { useReserva } from "./hooks/useReserva.js";
import { useEffect } from "react";
// ─── QUANTITY STEPPER ─────────────────────────────────────────────────────────
const QuantityStepper = ({ value, onChange, unit }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          border: `1.5px solid ${C.border}`,
          background: C.surface,
          color: C.muted,
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: C.font,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.accent;
          e.currentTarget.style.color = C.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.color = C.muted;
        }}
      >
        −
      </button>

      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && n >= 1) onChange(n);
          }}
          style={{
            width: 48,
            height: 28,
            textAlign: "center",
            border: `1.5px solid ${C.border}`,
            borderRadius: 7,
            background: C.card,
            color: C.dark,
            fontFamily: "monospace",
            fontSize: 13,
            fontWeight: 700,
            outline: "none",
            MozAppearance: "textfield",
          }}
        />
        {unit && (
          <span
            style={{
              fontSize: 10,
              color: C.muted,
              fontFamily: C.font,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      <button
        onClick={() => onChange(value + 1)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          border: `1.5px solid ${C.border}`,
          background: C.surface,
          color: C.muted,
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: C.font,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.green;
          e.currentTarget.style.color = C.green;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.color = C.muted;
        }}
      >
        +
      </button>
    </div>
  );
};

// ─── CART ITEM ROW ────────────────────────────────────────────────────────────
const CartItem = ({ item, onQtyChange, onRemove }) => {
  const {
    codSAP,
    descComponente,
    caracTecnicas,
    fabricante,
    tecnologia,
    estoque,
    quantity,
  } = item;

  const unit = estoque?.unidadeMedidaAbbr ?? "";
  const custo = estoque?.custoUnitario ?? 0;
  const subtotal = custo * quantity;

  const fmt = (n) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

  return (
    <div
      style={{
        background: C.card,
        border: `1.5px solid ${C.borderLt}`,
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        transition: "border-color 0.15s",
      }}
    >
      {/* linha 1: descrição + botão remover */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: C.dark,
              fontFamily: C.font,
              marginBottom: 2,
            }}
          >
            {descComponente}
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              fontFamily: C.font,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span>{caracTecnicas}</span>
            <span style={{ color: C.gray300 }}>·</span>
            <span style={{ color: C.accentDk, fontWeight: 600 }}>
              {fabricante}
            </span>
            {tecnologia && <TecBadge value={tecnologia} small />}
          </div>
        </div>

        <button
          onClick={() => onRemove(codSAP)}
          title="Remover item"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.muted,
            fontSize: 14,
            padding: "2px 4px",
            borderRadius: 4,
            transition: "color 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          ✕
        </button>
      </div>

      {/* linha 2: código + qtd + subtotal */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {/* código SAP */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span
            style={{
              fontSize: 10,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontFamily: C.font,
            }}
          >
            Cód. SAP
          </span>
          <span
            style={{
              background: C.greenLo,
              border: `1.5px solid ${C.green}`,
              color: C.green,
              borderRadius: 6,
              padding: "3px 10px",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {codSAP}
          </span>
        </div>

        {/* stepper de quantidade */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontFamily: C.font,
            }}
          >
            Quantidade
          </span>
          <QuantityStepper
            value={quantity}
            unit={unit}
            onChange={(n) => onQtyChange(codSAP, n)}
          />
        </div>

        {/* subtotal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            alignItems: "flex-end",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontFamily: C.font,
            }}
          >
            Subtotal
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.dark,
              fontFamily: C.font,
            }}
          >
            {custo > 0 ? (
              fmt(subtotal)
            ) : (
              <span style={{ color: C.muted, fontSize: 13 }}>
                Custo não informado
              </span>
            )}
          </span>
          {custo > 0 && (
            <span style={{ fontSize: 10, color: C.muted, fontFamily: C.font }}>
              {fmt(custo)} × {quantity}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
const EmptyCart = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: "48px 24px",
      background: C.surface,
      borderRadius: 14,
      border: `1px dashed ${C.border}`,
    }}
  >
    <Icon name="cart" size={40} color="rgba(0,0,0,0.3)" />
    <span style={{ fontSize: 13, color: C.muted, fontFamily: C.font }}>
      Nenhum item no carrinho
    </span>
    <span
      style={{
        fontSize: 11,
        color: C.muted,
        fontFamily: C.font,
        textAlign: "center",
        maxWidth: 220,
      }}
    >
      Adicione componentes usando o botão "+" nos cards de busca ou nos
      resultados
    </span>
  </div>
);

// ─── MACHINE SELECTOR (Melhorado com Select) ─────────────────────────────────
const MachineSelector = ({ machines, selectedMachine, onSelect }) => {
  // Se não há máquinas, não mostra nada
  if (machines.length === 0) return null;

  return (
    <div
      style={{
        background: C.surface,
        border: `1.5px solid ${C.borderLt}`,
        borderRadius: 10,
        padding: "12px 10px",
        // marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 8,
          fontFamily: C.font,
        }}
      >
        🔧 Máquina para a reserva
      </div>

      <select
        value={selectedMachine?.mMaquina || ""}
        onChange={(e) => {
          const selected = machines.find((m) => m.mMaquina === e.target.value);
          if (selected) onSelect(selected);
        }}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: `1.5px solid ${C.border}`,
          background: C.card,
          fontFamily: C.font,
          fontSize: 13,
          color: C.dark,
          cursor: "pointer",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = C.accent)}
        onBlur={(e) => (e.target.style.borderColor = C.border)}
      >
        {machines.map((machine) => (
          <option key={machine.mMaquina} value={machine.mMaquina}>
            {machine.maquina} ({machine.mMaquina})
          </option>
        ))}
      </select>

      {machines.length > 1 && (
        <div
          style={{
            fontSize: 10,
            color: C.muted,
            marginTop: 6,
            fontFamily: C.font,
          }}
        >
          ⚠ Materiais de {machines.length} máquinas diferentes no carrinho
        </div>
      )}
    </div>
  );
};

// ─── ORDER SUMMARY (com useReserva integrado) ─────────────────────────────────
// OrderSummary component (dentro do ShoppingCart.jsx)
const OrderSummary = ({ items, onClearCart }) => {
  const [osDescription, setOsDescription] = useState(
    "Material para atuação em quebra",
  );
  const {
    criarReserva,
    loading,
    error,
    reserva,
    status,
    numeroReservaPrincipal, // ✅ Pega o número da reserva
  } = useReserva();

  // console.log(reserva);
  const fmt = (n) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

  const itemsWithCost = items.filter((i) => i.estoque?.custoUnitario > 0);
  const itemsNoCost = items.filter((i) => !(i.estoque?.custoUnitario > 0));

  const total = itemsWithCost.reduce(
    (acc, i) => acc + i.estoque.custoUnitario * i.quantity,
    0,
  );
  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);

  // Agrupa máquinas dos materiais
  const uniqueMachines = useMemo(() => {
    const machinesMap = new Map();
    items.forEach((item) => {
      if (item.meta?.mMaquina) {
        machinesMap.set(item.meta.mMaquina, {
          mMaquina: item.meta.mMaquina,
          maquina: item.meta.maquina,
          linha: item.meta.linha,
          ute: item.meta.ute,
          operacao: item.meta.operacao,
          tipoMaquina: item.meta.tipoMaquina,
        });
      }
    });
    return Array.from(machinesMap.values());
  }, [items]);

  const [selectedMachine, setSelectedMachine] = useState(null);

  useEffect(() => {
    if (uniqueMachines.length > 0 && !selectedMachine) {
      setSelectedMachine(uniqueMachines[0]);
    }
  }, [uniqueMachines]);

  const handleFinalizar = async () => {
    if (uniqueMachines.length === 0) {
      alert("Nenhuma máquina associada aos materiais");
      return;
    }

    if (!selectedMachine) {
      alert("Selecione uma máquina para a reserva");
      return;
    }

    const materiais = items.map((item) => ({
      codigo: item.estoque?.codigoSap || item.codSAP,
      quantidade: item.quantity,
    }));

    const reservaData = {
      codigoMaquina: selectedMachine.mMaquina,
      materiais,
      descricaoOS: osDescription,
      descricaoAtividade: osDescription,
      aguardarSAP: true,
      maxAttempts: 10,
      intervalSeconds: 3,
    };

    const result = await criarReserva(reservaData);

    if (result?.success) {
      setTimeout(() => {
        onClearCart();
      }, 3000);
    }
  };

  const isButtonDisabled = loading || reserva;

  return (
    <div
      style={{
        background: C.card,
        border: `1.5px solid ${C.borderLt}`,
        borderRadius: 14,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        position: "sticky",
        top: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontWeight: 600,
          fontFamily: C.font,
        }}
      >
        Resumo do Pedido
      </div>

      <MachineSelector
        machines={uniqueMachines}
        selectedMachine={selectedMachine}
        onSelect={setSelectedMachine}
      />

      {/* Descrição da Ordem de Serviço */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          style={{
            fontSize: 11,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            fontFamily: C.font,
          }}
        >
          Descrição da Ordem de Serviço
        </label>
        <textarea
          value={osDescription}
          onChange={(e) => setOsDescription(e.target.value)}
          placeholder="Descreva a atividade de manutenção..."
          rows={2}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontFamily: C.font,
            fontSize: 13,
            color: C.dark,
            background: C.bg,
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = C.accent)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
      </div>

      {/* linha itens */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: C.muted,
          fontFamily: C.font,
        }}
      >
        <span>Tipos de materiais</span>
        <span style={{ fontWeight: 600, color: C.dark }}>{items.length}</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: C.muted,
          fontFamily: C.font,
        }}
      >
        <span>Qtd. total de itens</span>
        <span style={{ fontWeight: 600, color: C.dark }}>{totalQty}</span>
      </div>

      {itemsNoCost.length > 0 && (
        <div
          style={{
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 11,
            color: "#b45309",
            fontFamily: C.font,
            lineHeight: 1.5,
          }}
        >
          ⚠ {itemsNoCost.length} item{itemsNoCost.length > 1 ? "s" : ""} sem
          custo cadastrado — não incluso no total
        </div>
      )}

      <div style={{ borderTop: `1px solid ${C.borderLt}`, paddingTop: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: C.muted,
              fontFamily: C.font,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            Total estimado
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: C.dark,
              fontFamily: C.font,
            }}
          >
            {fmt(total)}
          </span>
        </div>
      </div>

      {/* ✅ RESULTADO DA RESERVA - VERSÃO MELHORADA */}
      {reserva && (
        <div
          style={{
            background: C.greenLo,
            border: `1.5px solid ${C.green}`,
            borderRadius: 8,
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>
            Reserva criada com sucesso!
          </div>

          {/* ✅ NÚMERO DA RESERVA PRINCIPAL - DESTACADO */}
          {numeroReservaPrincipal && (
            <div
              style={{
                marginTop: 8,
                padding: "6px 12px",
                background: C.bg,
                borderRadius: 6,
                display: "inline-block",
                width: "100%",
              }}
            >
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5 }}>
                Número da Reserva SAP
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: C.green,
                  letterSpacing: 1,
                }}
              >
                {numeroReservaPrincipal}
              </div>
            </div>
          )}

          {/* Número da OS */}
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
            OS: {reserva.orderNumber}
          </div>

          {/* Status da integração */}
          {status?.status === "completed" && (
            <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>
              ✓ Integração SAP concluída
            </div>
          )}

          {status?.status === "processing" && (
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              ⏳ Aguardando integração SAP... ({status.integratedCount}/
              {status.totalCount})
            </div>
          )}

          {/* Lista de materiais reservados */}
          {reserva.reservas && reserva.reservas.length > 0 && (
            <div
              style={{
                marginTop: 10,
                textAlign: "left",
                fontSize: 10,
                color: C.muted,
                borderTop: `1px solid ${C.borderLt}`,
                paddingTop: 8,
              }}
            >
              <strong>Materiais reservados:</strong>
              <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                {reserva.reservas.map((r, idx) => (
                  <li key={idx}>
                    {r.codigo} - {r.quantidade} un
                    {r.sequencialItem && (
                      <span style={{ color: C.green, fontSize: 9 }}>
                        {" "}
                        (item {r.sequencialItem})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Erro */}
      {error && !reserva && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1.5px solid #ef4444",
            borderRadius: 8,
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>❌</div>
          <div style={{ fontSize: 12, color: "#ef4444" }}>{error}</div>
        </div>
      )}

      {/* Ações */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 4,
        }}
      >
        <button
          onClick={handleFinalizar}
          disabled={isButtonDisabled}
          style={{
            background: C.accent,
            border: "none",
            borderRadius: 9,
            padding: "11px 0",
            color: "#fff",
            fontFamily: C.font,
            fontSize: 13,
            fontWeight: 600,
            cursor: isButtonDisabled ? "not-allowed" : "pointer",
            transition: "opacity 0.15s",
            letterSpacing: 0.3,
            opacity: isButtonDisabled ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isButtonDisabled) e.currentTarget.style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            if (!isButtonDisabled) e.currentTarget.style.opacity = "1";
          }}
        >
          {loading ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "center",
              }}
            >
              <span className="spinner" /> Processando...
            </span>
          ) : reserva ? (
            "✓ Reserva finalizada"
          ) : (
            "📦 Finalizar reserva"
          )}
        </button>

        <button
          onClick={onClearCart}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            borderRadius: 9,
            padding: "9px 0",
            color: C.muted,
            fontFamily: C.font,
            fontSize: 12,
            cursor: "pointer",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.borderColor = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = C.muted;
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          ✕ Limpar carrinho
        </button>
      </div>

      <style>{`
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #fff;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ShoppingCart = ({
  cartItems = [],
  onQtyChange,
  onRemoveItem,
  onClearCart,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {/* ── LISTA DE ITENS ── */}
      <div
        style={{
          flex: "1 1 340px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={item.codSAP || item.id}
              item={item}
              onQtyChange={onQtyChange}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* ── RESUMO ── */}
      {cartItems.length > 0 && (
        <div style={{ flex: "0 0 320px", minWidth: 280 }}>
          <OrderSummary items={cartItems} onClearCart={onClearCart} />
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;
