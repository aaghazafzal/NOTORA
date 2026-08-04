import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { auth, getFirebaseErrorMessage } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — LumenPages" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
      setIsSent(true);
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Panel - Branding (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-50 mix-blend-screen" />
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-primary/20 blur-[120px]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display text-3xl font-black text-white">LumenPages</span>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h2 className="font-display text-4xl font-bold leading-tight text-white lg:text-5xl">
            Regain access to your library.
          </h2>
          <p className="mt-6 text-lg text-zinc-400">
            Don't worry, it happens to the best of us. We'll get you back to your reading in no time.
          </p>
        </div>
        
        <div className="relative z-10 text-sm text-zinc-500">
          © {new Date().getFullYear()} LumenPages. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form (Mobile & Desktop) */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Mobile Header (Hidden on Desktop) */}
          <Link to="/" className="mb-10 flex items-center justify-center gap-2 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary neon-glow">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-black">LumenPages</span>
          </Link>

          <div className="text-center lg:text-left">
            <h1 className="font-display text-3xl font-bold tracking-tight">Reset password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email to receive a reset link.
            </p>
          </div>
          
          <div className="mt-8 transition-all duration-500">
            {isSent ? (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="rounded-2xl border border-border bg-card p-6 text-center">
                  <p className="text-sm text-foreground mb-6">
                    We have sent a password reset link to <br/>
                    <strong className="text-primary mt-1 block">{email}</strong><br/>
                    Please check your inbox.
                  </p>
                  <Button asChild variant="outline" className="w-full rounded-xl py-6 border-border bg-card hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-all">
                    <Link to="/auth/sign-in">Return to Sign In</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-500" onSubmit={handleResetPassword}>
                <div className="space-y-1.5">
                  <Label htmlFor="e" className="text-sm font-medium">Email address</Label>
                  <Input
                    id="e"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl h-12 bg-background border-border focus-visible:ring-primary"
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl h-12 neon-glow font-bold text-base mt-2" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Send Reset Link"}
                </Button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link to="/auth/sign-in" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
