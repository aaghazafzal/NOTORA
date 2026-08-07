import { create } from "zustand";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));

// Set up the listener immediately
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Sync MongoDB profile with Firebase Auth (backward compatibility for old uploads)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/users/${user.uid}`,
      );
      if (res.ok) {
        const dbUser = await res.json();
        if (dbUser.photoUrl && user.photoURL !== dbUser.photoUrl) {
          const { updateProfile } = await import("firebase/auth");
          await updateProfile(user, {
            photoURL: dbUser.photoUrl,
            displayName: dbUser.name || user.displayName,
          });
          // Clone the user to force a state update with the new photoURL
          user = Object.assign({}, user) as User;
        }
      }
    } catch (e) {
      console.error("Profile sync failed:", e);
    }
  }
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setLoading(false);
});
