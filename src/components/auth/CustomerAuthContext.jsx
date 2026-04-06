// context/CustomerAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const CustomerAuthContext = createContext(null);

const STORAGE_KEY = "ts_customer";

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("ts_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist cart
  useEffect(() => {
    localStorage.setItem("ts_cart", JSON.stringify(cart));
  }, [cart]);

  const login = (customerData) => {
    setCustomer(customerData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
    setCart([]);
    localStorage.removeItem("ts_cart");
  };

  // ── Cart helpers ──────────────────────────
  const addToCart = (product, variant, quantity = 1) => {
    const key = `${product.id}-${variant?.id ?? "no-variant"}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, quantity: parseFloat((i.quantity + quantity).toFixed(2)) }
            : i,
        );
      }
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          variant_id: variant?.id ?? null,
          common_name: product.common_name,
          scientific_name: product.scientific_name || null,
          image_url: product.image_url || null,
          size_range:
            variant?.size && variant.size !== "-" ? variant.size : null,
          unit: variant?.unit || "kg",
          unit_price: parseFloat(variant?.selling_price) || 0,
          total_price: parseFloat(
            ((parseFloat(variant?.selling_price) || 0) * quantity).toFixed(2),
          ),
          quantity,
        },
      ];
    });
  };

  const removeFromCart = (key) =>
    setCart((prev) => prev.filter((i) => i.key !== key));

  const updateQuantity = (key, quantity) => {
    const qty = parseFloat(quantity);
    if (qty <= 0) return removeFromCart(key);
    setCart((prev) =>
      prev.map((i) =>
        i.key === key
          ? {
              ...i,
              quantity: qty,
              total_price: parseFloat((i.unit_price * qty).toFixed(2)),
            }
          : i,
      ),
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.total_price, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        login,
        logout,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx)
    throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
  return ctx;
}
