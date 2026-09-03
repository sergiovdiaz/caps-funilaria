// * MachineLedgerPage.jsx  (atualizado)
//  * ─────────────────────────────────────────────────────────────────────────────
//  * Adicionado:
//  *   - Layout flexível com sidebar que empurra o conteúdo
//  *   - TreeSidebar integrada com navegação
//  *   - Estado de expansão da sidebar
//  * ─────────────────────────────────────────────────────────────────────────────
//  */

import { useState, useEffect } from "react";
import { C } from "../components/machineledger/data/theme.js";
import { CartFab } from "../components/machineledger/ui/UI.jsx";
import SearchResults from "../components/machineledger/SearchResults";
import ShoppingCart from "../components/machineledger/ShoppingCart";
import { useCart } from "../components/machineledger/hooks/useCart.js";
import { MachineLedgerHeader } from "../components/machineledger/MachineLedgerHeader";
import { SelectionStep } from "../components/machineledger/SelectionStep";
import { useMachineData } from "../components/machineledger/hooks/useMachineData.js";
// import { useBreadcrumbs } from "../components/machineledger/hooks/useBreadcrumbs.js";
import { Icon } from "../components/machineledger/ui/Icon.jsx";
import { TreeSidebar } from "../components/machineledger/TreeSidebar.jsx";
import {
  NavigationProvider,
  useNavigation,
  useBreadcrumbs,
} from "../components/machineledger/contexts/NavigationContext.jsx";

// ─── CartDrawer ───────────────────────────────────────────────────────────────
const CartDrawer = ({
  open,
  onClose,
  cartItems,
  onQtyChange,
  onRemoveItem,
  onClearCart,
}) => (
  <>
    {open && (
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 299,
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(2px)",
        }}
      />
    )}

    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 300,
        width: "min(680px, 95vw)",
        background: C.bg,
        borderLeft: `1.5px solid ${C.border}`,
        boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 24px 14px",
          borderBottom: `1px solid ${C.borderLt}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="cart" size={20} color="rgba(0,0,0,0.3)" />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Carrinho de compras
            {cartItems.length > 0 && (
              <span
                style={{
                  background: C.accentMut,
                  color: C.accent,
                  borderRadius: 20,
                  padding: "1px 8px",
                  fontSize: 10,
                  border: `1px solid ${C.accentLo}`,
                }}
              >
                {cartItems.length} {cartItems.length === 1 ? "item" : "itens"}
              </span>
            )}
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: "4px 10px",
            cursor: "pointer",
            color: C.muted,
            fontFamily: C.font,
            fontSize: 12,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.dark)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          ✕ Fechar
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <ShoppingCart
          cartItems={cartItems}
          onQtyChange={onQtyChange}
          onRemoveItem={onRemoveItem}
          onClearCart={onClearCart}
        />
      </div>
    </div>
  </>
);

// ─── Componente interno que CONSOOME o contexto ─────────────────────────────
const MachineLedgerContent = () => {
  // ✅ Tudo vem do contexto agora!
  const {
    selection, // ← antes era estado local
    step, // ← antes era estado local
    searchQuery, // ← antes era searchQ
    isTreeExpanded, // ← antes era estado local
    toggleTree, // ← antes era setIsTreeExpanded
    setSearchQuery, // ← antes era setSearchQ
    selectLevel, // ← antes era handleSelect (mas agora no contexto!)
    navigateTree, // ← antes era handleTreeNavigate
    breadcrumbClick, // ← antes era handleStepClick
  } = useNavigation();

  const [cartOpen, setCartOpen] = useState(false);
  const {
    cartItems,
    addToCart,
    removeFromCart,
    removeItem,
    clearCart,
    changeQty,
  } = useCart();
  // ✅ Breadcrumbs agora é um hook que usa o contexto internamente
  const breadcrumbs = useBreadcrumbs();

  // ✅ Dados baseados na seleção atual (mesma lógica)
  const {
    utes,
    linhas,
    operacoes,
    tiposMaquina,
    maquinas,
    componentes,
    loading,
  } = useMachineData(
    selection.ute,
    selection.linha,
    selection.operacao,
    selection.tipoMaquina,
    selection.maquina,
  );

  // ✅ Search: agora usa a action do contexto
  const handleSearchSelect = (item) => {
    // Navega diretamente para a máquina encontrada
    selectLevel("maquina", item.meta.maquina);
    setSearchQuery(""); // Limpa a busca
  };

  const options = {
    utes,
    linhas,
    operacoes,
    tiposMaquina,
    maquinas,
    componentes,
  };


  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        minHeight: "80vh",
        background: C.bg,
        color: C.dark,
        fontFamily: C.font,
        width: "100%",
      }}
    >
      {/* ✅ Sidebar agora só precisa do básico */}
      <TreeSidebar
        isExpanded={isTreeExpanded}
        onToggle={toggleTree}
        // ❌ REMOVIDO: onNavigate (agora usa contexto internamente)
        // ❌ REMOVIDO: selection (agora usa contexto internamente)
      />

      {/* Conteúdo principal */}
      <div
        style={{
          flex: 1,
          overflowX: "auto",
          transition: "margin 0.26s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ padding: "0 24px", margin: "0 auto" }}>
          {/* ✅ Header recebe breadcrumbs do hook */}
          <MachineLedgerHeader
            breadcrumbs={breadcrumbs}
            searchQ={searchQuery}
            setSearchQ={setSearchQuery}
            cartCount={cartItems.length}
            onOpenCart={() => setCartOpen(true)}
          />

          {/* ✅ SelectionStep agora recebe MUITO menos props! */}
          {searchQuery.length > 1 ? (
            <SearchResults
              query={searchQuery}
              onSelectMaquina={handleSearchSelect}
              onAddToCart={addToCart}
            />
          ) : (
            <SelectionStep
              // ❌ REMOVIDO: step, selected, onSelectLevel (usa contexto)
              options={options}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              cartItems={cartItems}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Carrinho drawer (extraído para componente separado) */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onQtyChange={changeQty}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
      />

      {!cartOpen && (
        <CartFab count={cartItems.length} onClick={() => setCartOpen(true)} />
      )}
    </div>
  );
};

// ─── Componente PRINCIPAL com o Provider ────────────────────────────────────
export const MachineLedgerPage = () => {
  return (
    <NavigationProvider>
      <MachineLedgerContent />
    </NavigationProvider>
  );
};

export default MachineLedgerPage;
