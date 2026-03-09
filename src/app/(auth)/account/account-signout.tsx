"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export function AccountSignOut() {
  const router = useRouter();
  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };
  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
