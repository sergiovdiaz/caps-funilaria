import { SearchBar, Breadcrumb } from "./ui/UI";
import { Icon } from "./ui/Icon";
import { C } from "./data/theme.js";

export const MachineLedgerHeader = ({
  breadcrumbs,
  searchQ,
  setSearchQ,
  cartCount,
  onOpenCart,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}
  >
    <Breadcrumb steps={breadcrumbs} />
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* <SearchBar value={searchQ} onChange={setSearchQ} /> */}
      <button
        onClick={onOpenCart}
        style={{
          background: cartCount > 0 ? C.accentMut : C.surface,
          border: `1.5px solid ${cartCount > 0 ? C.accent : C.border}`,
          borderRadius: 9,
          padding: "7px 14px",
          cursor: "pointer",
          color: cartCount > 0 ? C.accent : C.muted,
          fontFamily: C.font,
          fontSize: 13,
          fontWeight: cartCount > 0 ? 600 : 400,
          display: "flex",
          alignItems: "center",
          gap: 7,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        <Icon
          name="cart"
          size={16}
          color={cartCount > 0 ? C.accent : C.muted}
          style={{ opacity: 0.9 }}
        />
        {cartCount > 0
          ? `${cartCount} ${cartCount === 1 ? "item" : "itens"}`
          : "Cesta"}
      </button>
    </div>
  </div>
);
