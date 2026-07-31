import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Loader2, Camera, Check } from "lucide-react";
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
      { title: "Sign up — LumenPages" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignUpPage,
});

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
      
      toast.success("Welcome to LumenPages!");
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
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-background via-background to-card px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary neon-glow">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-black">LumenPages</span>
        </Link>
        
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl overflow-hidden relative transition-all duration-500">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="font-display text-2xl font-bold">Create an account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Join the community of readers.
              </p>
              
              <div className="mt-6 space-y-2">
                <Button variant="outline" className="w-full rounded-full h-11" onClick={handleGoogleSignUp}>
                  Continue with Google
                </Button>
              </div>
              
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or with email
                <div className="h-px flex-1 bg-border" />
              </div>
              
              <form className="space-y-4" onSubmit={handleEmailSignUp}>
                <div className="space-y-1">
                  <Label htmlFor="n">Name</Label>
                  <Input
                    id="n"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl bg-background/50"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="e">Email</Label>
                  <Input
                    id="e"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl bg-background/50"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p">Password</Label>
                  <Input
                    id="p"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl bg-background/50"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Must be at least 6 characters long.
                  </p>
                </div>
                <Button type="submit" className="w-full rounded-full neon-glow h-11 mt-2" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
              
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth/sign-in" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                <h1 className="font-display text-2xl font-bold">Complete your profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Let the community know a bit about you.
                </p>
              </div>
              
              <form onSubmit={handleCompleteProfile} className="space-y-6">
                <div className="flex flex-col items-center gap-2">
                  <Label htmlFor="photo" className="relative cursor-pointer group">
                    <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl transition-all group-hover:opacity-80 group-hover:ring-primary/50">
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

                <div className="space-y-1">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl bg-background/50"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="bio">Bio <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Avid reader, curator of fine literature..."
                    className="rounded-xl bg-background/50 resize-none h-24"
                  />
                </div>

                <Button type="submit" className="w-full rounded-full neon-glow h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
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
  );
}
