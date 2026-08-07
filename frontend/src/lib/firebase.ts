import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCjjyqMKHC1B8lGNEWBLKqvXtc5G3dnnrY",
  authDomain: "notora-univora.firebaseapp.com",
  projectId: "notora-univora",
  storageBucket: "notora-univora.firebasestorage.app",
  messagingSenderId: "455358905871",
  appId: "1:455358905871:web:0c11a687deda02246b6d7a",
  measurementId: "G-7TGGFSEVKG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function getFirebaseErrorMessage(error: any): string {
  if (!error || !error.code) return error?.message || "An unexpected error occurred.";

  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already in use. Please sign in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "No account found with this email. Please sign up.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/weak-password":
      return "Your password is too weak. Please use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later or reset your password.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    default:
      return "Something went wrong. Please try again.";
  }
}
