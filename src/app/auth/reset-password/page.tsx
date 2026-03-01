"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Give the Supabase client a moment to process the hash token,
    // then check if we already have a recovery session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
        return;
      }

      // Listen for the PASSWORD_RECOVERY event fired by the Supabase client
      // after it automatically exchanges the #access_token hash fragment.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
          subscription.unsubscribe();
        }
      });

      // If no event fires within 5 seconds, the link is invalid/missing.
      const timeout = setTimeout(() => {
        setSessionError("Invalid or missing reset link. Please request a new one.");
        subscription.unsubscribe();
      }, 5000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    });
  }, []);

  async function handleReset() {
    if (password !== confirmPassword) {
      return setMessage("Passwords do not match.");
    }
    if (password.length < 6) {
      return setMessage("Password must be at least 6 characters.");
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) return setMessage(error.message);

    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (sessionError) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-sm px-8 py-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Expired</h1>
          <p className="text-sm text-red-500 mb-6">{sessionError}</p>
          <button
            onClick={() => router.replace("/login")}
            className="w-full bg-black text-white text-sm font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  if (!sessionReady) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <p className="text-sm text-gray-500">Verifying reset link…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm px-8 py-10">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Set New Password
        </h1>

        <div className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {message && (
          <p className="mt-4 text-sm text-center text-red-500">{message}</p>
        )}

        <button
          onClick={handleReset}
          disabled={loading || !password || !confirmPassword}
          className="mt-6 w-full bg-black text-white text-sm font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </main>
  );
}
