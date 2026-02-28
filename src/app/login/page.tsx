"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setMessage(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleLogin() {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) return setMessage(error.message);

    router.push("/app");
  }

  async function handleForgotPassword() {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);

    if (error) return setMessage(error.message);

    setMessage("Check your email for a password reset link.");
  }

  async function handleSignup() {
    if (password !== confirmPassword) {
      return setMessage("Passwords do not match.");
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) return setMessage(error.message);

    setMessage("Account created! Check your email to confirm, then log in.");
  }

  const isLogin = mode === "login";
  const isForgot = mode === "forgot";

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm px-8 py-10">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          {isLogin ? "Login" : isForgot ? "Reset Password" : "Signup"}
        </h1>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />

          {!isForgot && (
            <input
              type="password"
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          )}

          {!isLogin && !isForgot && (
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          )}
        </div>

        {isLogin && (
          <div className="mt-2 text-right">
            <button
              onClick={() => switchMode("forgot")}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        {message && (
          <p className={`mt-4 text-sm text-center ${isForgot && !message.startsWith("Check") ? "text-red-500" : isForgot ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}

        <button
          onClick={isForgot ? handleForgotPassword : isLogin ? handleLogin : handleSignup}
          disabled={
            loading ||
            !email ||
            (!isForgot && !password) ||
            (!isLogin && !isForgot && !confirmPassword)
          }
          className="mt-6 w-full bg-black text-white text-sm font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Please wait..." : isForgot ? "Send reset link" : isLogin ? "Login" : "Signup"}
        </button>

        <p className="mt-6 text-sm text-center text-gray-600">
          {isForgot ? (
            <>
              Remember your password?{" "}
              <button
                onClick={() => switchMode("login")}
                className="font-semibold text-gray-900 hover:underline"
              >
                Back to login
              </button>
            </>
          ) : (
            <>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => switchMode(isLogin ? "signup" : "login")}
                className="font-semibold text-gray-900 hover:underline"
              >
                {isLogin ? "Signup" : "Login"}
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
