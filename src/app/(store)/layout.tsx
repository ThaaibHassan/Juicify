import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const STORE_CATEGORIES = [
  { name: "Protein", slug: "protein" },
  { name: "Creatine", slug: "creatine" },
  { name: "Amino Acids", slug: "amino-acids" },
  { name: "Carbs", slug: "carbs" },
  { name: "Snacks", slug: "snacks" },
  { name: "Accessories", slug: "accessories" },
] as const;

export default async function StoreLayout({ children }: { children: ReactNode }) {
  let user: { id: string } | null = null;
  let isAdminOrStaff = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    user = u;
    if (u) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", u.id).single();
      isAdminOrStaff = (profile?.role ?? "customer") === "admin" || (profile?.role ?? "customer") === "staff";
    }
  } catch (_) {
    // Supabase env or auth failed; render store without user/admin state
  }
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-border bg-background shadow-sm">
        {/* Top bar: logo, search, actions */}
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10 flex items-center gap-4 sm:gap-6 py-4">
          <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight">
            <span className="rounded-md bg-foreground px-2 py-1 text-sm font-semibold text-background">
              Juicify
            </span>
          </Link>
          <Link href="/search" className="sm:hidden p-2 text-muted-foreground hover:text-foreground" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </Link>
          <form action="/search" method="get" className="flex-1 max-w-xl mx-auto hidden sm:block">
            <div className="relative">
              <Input
                type="search"
                name="q"
                placeholder="Search for any product or brand"
                className="w-full h-10 pl-4 pr-10 bg-muted/50 border-muted-foreground/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
            </div>
          </form>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-sm">
            <Link href="/cart" className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              Cart
            </Link>
            {isAdminOrStaff && (
              <Link href="/admin">
                <Button variant="secondary" size="sm">Admin</Button>
              </Link>
            )}
            <Link href={user ? "/account" : "/login"}>
              <Button variant="outline" size="sm">{user ? "Account" : "Sign In"}</Button>
            </Link>
          </div>
        </div>
        {/* Category nav bar */}
        <nav className="border-t border-border bg-muted/40" aria-label="Categories">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10 flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
            <Link href="/shop" className="font-medium text-foreground hover:underline flex items-center gap-1">
              All Categories
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </Link>
            <span className="text-muted-foreground/40" aria-hidden>|</span>
            {STORE_CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                {c.name}
              </Link>
            ))}
            <span className="flex-1" />
            <Link href="/shop" className="text-muted-foreground hover:text-foreground font-medium whitespace-nowrap">
              Best Deals
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10 pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-12 lg:pb-14">
          {children}
        </div>
      </main>
      <footer className="border-t bg-background/80 py-6">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10 text-center text-xs text-muted-foreground">
          Authentic supplements · Maldives delivery · Powered by Juicify
        </div>
      </footer>
    </div>
  );
}

