import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { auth, googleProvider, getFirebaseErrorMessage } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in — LumenPages" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error));
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
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Continue where you left off.
          </p>
          <div className="mt-6 space-y-2">
            <Button variant="outline" className="w-full rounded-full" onClick={handleGoogleSignIn}>
              Continue with Google
            </Button>
          </div>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or with email
            <div className="h-px flex-1 bg-border" />
          </div>
          <form className="space-y-3" onSubmit={handleEmailSignIn}>
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
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="p">Password</Label>
                <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="p"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full rounded-full neon-glow mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/auth/sign-up" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
