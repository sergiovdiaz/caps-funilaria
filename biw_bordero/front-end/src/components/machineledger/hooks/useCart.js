import { useState, useEffect } from "react";

const STORAGE_KEY = "cart_items_v1";

export const useCart = () => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 💾 salva sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.error("Erro ao salvar carrinho:", err);
    }
  }, [cartItems]);

  // ➕ adiciona
  const addToCart = (item, qty) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.codSAP === item.codSAP);

      if (exists) {
        return prev.map((i) =>
          i.codSAP === item.codSAP ? { ...i, quantity: i.quantity + qty } : i,
        );
      }

      return [...prev, { ...item, quantity: qty }];
    });
  };

  // ➖ remove parcial
  const removeFromCart = (item, qty) => {
    const key = item.estoque?.codigoSap ?? item.id;

    setCartItems((prev) =>
      prev
        .map((i) => {
          const iKey = i.estoque?.codigoSap ?? i.id;

          if (iKey !== key) return i;

          const newQty = i.quantity - qty;
          return newQty <= 0 ? null : { ...i, quantity: newQty };
        })
        .filter(Boolean),
    );
  };

  // ❌ remove item inteiro
  const removeItem = (codSAP) =>
    setCartItems((prev) => prev.filter((i) => i.codSAP !== codSAP));

  // 🧹 limpar carrinho
  const clearCart = () => {
    if (window.confirm("Limpar toda a cesta de compras?")) {
      setCartItems([]);
    }
  };

  // 🔁 alterar quantidade direto
  const changeQty = (codSAP, qty) => {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.codSAP === codSAP ? (qty <= 0 ? null : { ...i, quantity: qty }) : i,
        )
        .filter(Boolean),
    );
  };

  return {
    cartItems,
    addToCart,
    removeFromCart,
    removeItem,
    clearCart,
    changeQty,
  };
};
