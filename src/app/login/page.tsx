"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signUp() {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) return setMessage(error.message);

    // If email confirmations are ON, user must confirm before session exists.
    // If OFF, they'll be logged in immediately.
    setMessage("Signup successful. If confirmation is enabled, check your email. Otherwise you're in.");
  }

  async function signIn() {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return setMessage(error.message);

    router.push("/app");
  }

  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Login</h1>

      <label style={{ display: "block", marginBottom: 8 }}>
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@domain.com"
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        Password
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="••••••••"
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </label>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={signIn}
          disabled={loading || !email || !password}
          style={{ padding: "10px 14px", cursor: "pointer" }}
        >
          {loading ? "..." : "Sign in"}
        </button>

        <button
          onClick={signUp}
          disabled={loading || !email || !password}
          style={{ padding: "10px 14px", cursor: "pointer" }}
        >
          {loading ? "..." : "Sign up"}
        </button>
      </div>

      {message && <p style={{ marginTop: 12 }}>{message}</p>}

      <p style={{ marginTop: 18, opacity: 0.7 }}>
        Tip: if you enabled email confirmation in Supabase Auth, signup won't create a session until you confirm.
      </p>
    </main>
  );
}
