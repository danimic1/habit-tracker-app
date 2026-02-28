"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? "/login" : "/app");
      });
    } else {
      router.replace("/login");
    }
  }, [router, searchParams]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <p>Confirming your account…</p>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
