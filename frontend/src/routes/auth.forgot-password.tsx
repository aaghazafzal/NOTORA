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
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-background via-background to-card px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary neon-glow">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-black">LumenPages</span>
        </Link>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl">
          <h1 className="font-display text-2xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email to receive a reset link.
          </p>
          
          {isSent ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-foreground mb-4">
                We have sent a password reset link to <strong>{email}</strong>. Please check your inbox.
              </p>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to="/auth/sign-in">Return to Sign In</Link>
              </Button>
            </div>
          ) : (
            <form className="mt-6 space-y-3" onSubmit={handleResetPassword}>
              <div>
                <Label htmlFor="e">Email</Label>
                <Input
                  id="e"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full rounded-full neon-glow mt-4" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link to="/auth/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
