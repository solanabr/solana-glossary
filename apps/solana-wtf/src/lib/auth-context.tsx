"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { verifyWalletSignature } from "@/app/actions/wallet-auth";
import bs58 from "bs58";

/* ------------------------------------------------------------------ */
/*  Context shape                                                       */
/* ------------------------------------------------------------------ */

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithWallet: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                            */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, signMessage, connected } = useWallet();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  const signInWithWallet = useCallback(async () => {
    if (!publicKey || !signMessage || !connected) {
      console.warn("Wallet not connected");
      return;
    }

    try {
      const message = `Sign in to Solana WTF\nTimestamp: ${Date.now()}\nWallet: ${publicKey.toBase58()}`;
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      const result = await verifyWalletSignature(
        publicKey.toBase58(),
        signature,
        message
      );

      if (result.error || !result.token) {
        console.error("Wallet auth failed:", result.error);
        return;
      }

      // Exchange the token for a session
      const supabase = createClient();
      await supabase.auth.verifyOtp({
        token_hash: result.token,
        type: "magiclink",
      });
    } catch (err) {
      console.error("Wallet sign-in error:", err);
    }
  }, [publicKey, signMessage, connected]);

  const signOutFn = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signInWithGoogle,
        signInWithWallet,
        signOut: signOutFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
