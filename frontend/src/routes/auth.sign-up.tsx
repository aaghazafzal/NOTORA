import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Loader2, Camera, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { auth, googleProvider, getFirebaseErrorMessage } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile, User } from "firebase/auth";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Sign up — Notora" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignUpPage,
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

function SignUpPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Onboarding state
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const navigate = useNavigate();
  
  // Access global store to ensure it tracks the new user immediately
  const { setUser } = useAuthStore();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      setAuthUser(userCredential.user);
      setUser(userCredential.user); // update global store
      setStep(2); // Go to onboarding
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      setAuthUser(userCredential.user);
      setUser(userCredential.user);
      
      // Pre-fill name and photo from Google
      if (userCredential.user.displayName) {
        setName(userCredential.user.displayName);
      }
      if (userCredential.user.photoURL) {
        setPhotoPreview(userCredential.user.photoURL);
      }
      
      setStep(2); // Go to onboarding
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      if (photoFile) {
        formData.append("photo", photoFile);
      }
      
      const token = await authUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9090'}/api/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });
      
      if (!res.ok) throw new Error("Failed to complete profile");
      
      toast.success("Welcome to Notora!");
      navigate({ to: "/" });
    } catch (error: any) {
      toast.error("Failed to complete profile. You can do this later from Settings.");
      // Even if it fails, they are logged in, so let them into the app
      navigate({ to: "/" });
    } finally {
      setIsLoading(false);
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
            A universe of stories awaits you.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Sign up to discover new worlds, connect with authors, and curate your own digital library seamlessly.
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
          
          <div className="transition-all duration-500">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="text-center lg:text-left">
                  <h1 className="font-display text-3xl font-bold tracking-tight">Create an account</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Join the community of readers.
                  </p>
                </div>
                
                <div className="mt-8 space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl py-6 border-border bg-card hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-all" 
                    onClick={handleGoogleSignUp}
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
                  <span className="uppercase tracking-wider">or sign up with email</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                <form className="space-y-5" onSubmit={handleEmailSignUp}>
                  <div className="space-y-1.5">
                    <Label htmlFor="n" className="text-sm font-medium">Name</Label>
                    <Input
                      id="n"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl h-12 bg-background border-border focus-visible:ring-primary"
                      placeholder="Jane Doe"
                    />
                  </div>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="p" className="text-sm font-medium">Password</Label>
                    <Input
                      id="p"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl h-12 bg-background border-border focus-visible:ring-primary"
                      placeholder="••••••••"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Must be at least 6 characters long.
                    </p>
                  </div>
                  <Button type="submit" className="w-full rounded-xl h-12 neon-glow font-bold text-base mt-2" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create account"}
                  </Button>
                </form>
                
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/auth/sign-in" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center lg:text-left mb-8">
                  <h1 className="font-display text-3xl font-bold tracking-tight">Complete your profile</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Let the community know a bit about you.
                  </p>
                </div>
                
                <form onSubmit={handleCompleteProfile} className="space-y-6">
                  <div className="flex flex-col items-center lg:items-start gap-3">
                    <Label htmlFor="photo" className="relative cursor-pointer group">
                      <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl transition-all group-hover:opacity-80 group-hover:ring-primary/50">
                        <AvatarImage src={photoPreview || undefined} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-3xl text-primary font-display font-bold">
                          {name ? name.slice(0, 1).toUpperCase() : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                    </Label>
                    <p className="text-xs text-muted-foreground font-medium">Add a profile photo</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                    <Input
                      id="displayName"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl h-12 bg-background border-border focus-visible:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="bio" className="text-sm font-medium">Bio <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Avid reader, curator of fine literature..."
                      className="rounded-xl bg-background border-border focus-visible:ring-primary resize-none h-28 p-4"
                    />
                  </div>

                  <Button type="submit" className="w-full rounded-xl h-12 neon-glow font-bold text-base mt-4" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
