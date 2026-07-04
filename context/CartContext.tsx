"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { authClient } from "@/lib/auth/client";

const LS_KEY = "sb_cart";

export type CartItem = {
  productId: string;
  variantId?: string | null;
  qty: number;
  title: string;
  price: number;        // rupees
  coverImage: string;
  author?: string | null;
  type: string;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  loading: boolean;
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => Promise<void>;
  updateQty: (productId: string, variantId: string | null | undefined, qty: number) => Promise<void>;
  removeItem: (productId: string, variantId?: string | null) => void;
};

const Ctx = createContext<CartCtx | null>(null);

async function fetchDbCart(): Promise<CartItem[]> {
  const res = await fetch("/api/cart");
  const data = await res.json();
  return data.items ?? [];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const [items, setItems]   = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mergedRef = useRef(false);

  const isLoggedIn     = !session.isPending && !!session.data?.user;
  const sessionReady   = !session.isPending;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  // Persist to localStorage for guests
  useEffect(() => {
    if (!sessionReady || isLoggedIn || loading) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
  }, [items, sessionReady, isLoggedIn, loading]);

  // Merge localStorage into DB on login
  useEffect(() => {
    if (!sessionReady || !isLoggedIn || mergedRef.current || loading) return;
    mergedRef.current = true;

    (async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem(LS_KEY);
        const local: CartItem[] = raw ? JSON.parse(raw) : [];
        for (const item of local) {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: item.productId, variantId: item.variantId ?? null, qty: item.qty }),
          });
        }
        setItems(await fetchDbCart());
        localStorage.removeItem(LS_KEY);
      } catch {}
      setLoading(false);
    })();
  }, [sessionReady, isLoggedIn, loading]);

  const addItem = useCallback(async (item: Omit<CartItem, "qty"> & { qty?: number }) => {
    const qty = item.qty ?? 1;
    const vid = item.variantId ?? null;
    if (isLoggedIn) {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId, variantId: vid, qty }),
      });
      setItems(await fetchDbCart());
    } else {
      setItems(prev => {
        const idx = prev.findIndex(i => i.productId === item.productId && i.variantId === vid);
        if (idx >= 0) return prev.map((i, n) => n === idx ? { ...i, qty: i.qty + qty } : i);
        return [...prev, { ...item, variantId: vid, qty }];
      });
    }
  }, [isLoggedIn]);

  const updateQty = useCallback(async (productId: string, variantId: string | null | undefined, qty: number) => {
    const vid = variantId ?? null;
    if (isLoggedIn) {
      if (qty <= 0) {
        await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantId: vid }),
        });
      } else {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantId: vid, qty }),
        });
      }
      setItems(await fetchDbCart());
    } else {
      if (qty <= 0) {
        setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === vid)));
      } else {
        setItems(prev => prev.map(i => i.productId === productId && i.variantId === vid ? { ...i, qty } : i));
      }
    }
  }, [isLoggedIn]);

  const removeItem = useCallback((productId: string, variantId?: string | null) => {
    const vid = variantId ?? null;
    if (isLoggedIn) {
      fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId: vid }),
      }).catch(() => {});
    }
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === vid)));
  }, [isLoggedIn]);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <Ctx.Provider value={{ items, count, loading, addItem, updateQty, removeItem }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
