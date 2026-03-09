import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountSignOut } from "./account-signout";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirect=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .single();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{user.email}</p>
        {profile && (
          <>
            <p className="text-sm">{profile.full_name || "—"}</p>
            <p className="text-sm">{profile.phone || "—"}</p>
          </>
        )}
        {(profile?.role === "admin" || profile?.role === "staff") && (
          <Button asChild variant="secondary">
            <Link href="/admin">Admin dashboard</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/checkout">Go to checkout</Link>
        </Button>
        <AccountSignOut />
      </CardContent>
    </Card>
  );
}
