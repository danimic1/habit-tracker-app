"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? "/app" : "/login");
    });
  }, [router]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <p>Loading…</p>
    </main>
  );
}
