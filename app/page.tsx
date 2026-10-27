"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { login, user, profile, loading, demoMode } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && profile?.userRole === "admin") {
      router.replace("/overview");
    }
  }, [loading, user, profile, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
      router.push("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="login-page">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-intro">
          <h1>Welcome Back, Admin</h1>
          <p className="sub">Log in to manage your platform and stay in control.</p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="field-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              className="field"
              type="email"
              placeholder="You@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          {demoMode ? (
            <p className="login-demo-note">
              Add NEXT_PUBLIC_FIREBASE_* keys and serviceAccountKey.json, then restart the
              server.
            </p>
          ) : null}
          <button type="submit" className="login-submit" disabled={busy || demoMode}>
            {busy ? "Verifying…" : "Login"}
          </button>
        </form>

        <div className="login-guest">
          <p>Admin access only. Your account must have userRole &quot;admin&quot; in Firestore.</p>
        </div>
      </div>
    </div>
  );
}
