import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function AdminInvite() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Use signUp with auto-confirm (enabled in auth settings) so the new user
    // can log in immediately with the temporary password the admin shares.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Could not create user", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "User created",
      description: `Share these credentials with ${email}. They can change their password after logging in.`,
    });
    setEmail("");
    setPassword("");
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to calculator
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Invite a user</CardTitle>
            <CardDescription>
              Create a login for a teammate. Share the email and temporary password with them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input
                  id="password"
                  type="text"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? "Creating…" : "Create user"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
