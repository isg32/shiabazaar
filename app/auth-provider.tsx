"use client";

import { CartProvider } from "@/context/CartContext";

// Session state comes from `authClient.useSession()` where it's needed. The
// prebuilt Neon Auth UI provider used to wrap the whole app here, but nothing
// renders its components (sign-in/up use our own AuthForm) and it added ~0.5 MB
// of JavaScript to every page.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
