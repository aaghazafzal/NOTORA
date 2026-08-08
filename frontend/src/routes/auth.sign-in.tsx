import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { auth, googleProvider, getFirebaseErrorMessage } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [{ title: "Sign in — Notora" }, { name: "robots", content: "noindex" }],
  }),
  component: SignInPage,
});

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  );
}

function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        // Fallback for Brave/strict browsers
        await signInWithRedirect(auth, googleProvider);
      } else {
        toast.error(getFirebaseErrorMessage(error));
        setIsGoogleLoading(false);
      }
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Panel - Branding (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between bg-muted/30 border-r border-border p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-50 mix-blend-screen" />
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-primary/20 blur-[120px]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display text-3xl font-black text-foreground">Notora</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="font-display text-4xl font-bold leading-tight text-foreground lg:text-5xl">
            Dive back into your favorite stories.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Join thousands of readers discovering and sharing the world's best digital books on a
            platform designed for the modern reader.
          </p>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Notora. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form (Mobile & Desktop) */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-12 lg:p-16 relative">
        <Button
          asChild
          variant="ghost"
          className="absolute left-4 top-4 sm:left-8 sm:top-8 gap-2 text-muted-foreground hover:text-foreground hidden lg:flex"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to home</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>

        <div className="w-full max-w-sm sm:max-w-md mt-8 lg:mt-0">
          {/* Mobile Header (Hidden on Desktop) */}
          <Link to="/" className="mb-10 flex items-center justify-center gap-2 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary neon-glow">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-black">Notora</span>
          </Link>

          <div className="text-center lg:text-left">
            <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account to continue.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              variant="outline"
              className="w-full rounded-xl py-6 border-border bg-card hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-all"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon className="mr-3 h-5 w-5" />
              )}
              Continue with Google
            </Button>
          </div>

          <div className="my-8 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span className="uppercase tracking-wider">or sign in with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-5" onSubmit={handleEmailSignIn}>
            <div className="space-y-1.5">
              <Label htmlFor="e" className="text-sm font-medium">
                Email address
              </Label>
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="p" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="p"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-12 bg-background border-border focus-visible:ring-primary pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl h-12 neon-glow font-bold text-base mt-2"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/auth/sign-up" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
