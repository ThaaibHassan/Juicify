"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

function getCartCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]") as { qty?: number }[];
    return cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
  } catch {
    return 0;
  }
}

export function CartLinkWithBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getCartCount());
    const onCartUpdate = () => setCount(getCartCount());
    window.addEventListener("cart-updated", onCartUpdate);
    window.addEventListener("storage", onCartUpdate);
    return () => {
      window.removeEventListener("cart-updated", onCartUpdate);
      window.removeEventListener("storage", onCartUpdate);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5"
    >
      <span className="relative inline-flex">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1"/>
          <circle cx="19" cy="21" r="1"/>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
        </svg>
        {count > 0 && (
          <Badge variant="default" className="absolute -top-2.5 -right-2.5 min-w-[1.25rem] h-5 px-1 text-xs">
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </span>
      <span>Cart</span>
    </Link>
  );
}
