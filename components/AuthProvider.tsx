"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type AdminProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  userRole: "admin";
};

type AuthContextValue = {
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function verifyAdmin(user: User): Promise<AdminProfile> {
  const token = await user.getIdToken();
  const res = await fetch("/api/auth/verify", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Admin verification failed");
  }
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    userRole: "admin",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const rejectSession = useCallback(async () => {
    setUser(null);
    setProfile(null);
    const auth = getFirebaseAuth();
    if (auth?.currentUser) {
      try {
        await signOut(auth);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const unsub = onAuthStateChanged(auth, (next) => {
      void (async () => {
        if (!next) {
          if (!cancelled) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        try {
          const adminProfile = await verifyAdmin(next);
          if (cancelled) return;
          setUser(next);
          setProfile(adminProfile);
        } catch {
          if (cancelled) return;
          await rejectSession();
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [rejectSession]);

  const login = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!isFirebaseConfigured || !auth) {
      throw new Error("Firebase Auth is not configured. Check your .env keys.");
    }

    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    try {
      const adminProfile = await verifyAdmin(cred.user);
      setUser(cred.user);
      setProfile(adminProfile);
    } catch (err) {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      throw err instanceof Error
        ? err
        : new Error("Only admin users can access this dashboard.");
    }
  };

  const logout = async () => {
    await rejectSession();
  };

  const getIdToken = async () => {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      demoMode: !isFirebaseConfigured,
      login,
      logout,
      getIdToken,
    }),
    [user, profile, loading, rejectSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
