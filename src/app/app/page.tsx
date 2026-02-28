"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import HabitGrid from "./HabitGrid";

type Habit = {
  id: string;
  name: string;
  streak: number;
  last_checked_in: string | null;
  completedDates: Set<string>;
};

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      fetchHabits(session.user.id);
    });
  }, [router]);

  async function fetchHabits(userId: string) {
    const [habitsResult, logsResult] = await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_logs")
        .select("habit_id, date")
        .eq("user_id", userId)
        .eq("completed", true)
        .gte("date", (() => {
          const d = new Date();
          d.setDate(d.getDate() - 182);
          return d.toISOString().split("T")[0];
        })()),
    ]);

    if (habitsResult.error) { setPageError(habitsResult.error.message); setLoading(false); return; }
    if (logsResult.error) { setPageError(logsResult.error.message); setLoading(false); return; }

    const logsByHabit = new Map<string, Set<string>>();
    for (const log of logsResult.data ?? []) {
      if (!logsByHabit.has(log.habit_id)) logsByHabit.set(log.habit_id, new Set());
      logsByHabit.get(log.habit_id)!.add(log.date);
    }

    const habits = (habitsResult.data ?? []).map((h) => ({
      ...h,
      completedDates: logsByHabit.get(h.id) ?? new Set<string>(),
    }));

    setHabits(habits);
    setLoading(false);
  }

  async function addHabit() {
    if (!newHabit.trim() || !user) return;
    setAdding(true);

    const { data, error } = await supabase
      .from("habits")
      .insert({ name: newHabit.trim(), user_id: user.id, streak: 0, last_checked_in: null })
      .select()
      .single();

    setAdding(false);
    if (error) setPageError(error.message);
    else if (data) {
      setHabits((prev) => [...prev, { ...data, completedDates: new Set<string>() }]);
      setNewHabit("");
    }
  }

  async function checkIn(habit: Habit) {
    const today = new Date().toISOString().split("T")[0];
    if (habit.last_checked_in === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const newStreak = habit.last_checked_in === yesterday ? habit.streak + 1 : 1;

    const { error: updateError } = await supabase
      .from("habits")
      .update({ streak: newStreak, last_checked_in: today })
      .eq("id", habit.id);

    if (updateError) { setPageError(updateError.message); return; }

    const { error: logError } = await supabase
      .from("habit_logs")
      .insert({
        habit_id: habit.id,
        user_id: user!.id,
        date: today,
        completed: true,
        note: null,
      });

    if (logError) { setPageError(logError.message); return; }

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habit.id) return h;
        const updated = new Set(h.completedDates);
        updated.add(today);
        return { ...h, streak: newStreak, last_checked_in: today, completedDates: updated };
      })
    );
  }

  async function deleteHabit(id: string) {
    await supabase.from("habits").delete().eq("id", id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
    <main style={{ padding: "40px 24px", maxWidth: 560, margin: "0 auto", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h1 style={{ fontSize: 24, margin: 0, fontWeight: 700, letterSpacing: "-0.3px", color: "#0f172a" }}>Habit Streak</h1>
        <button
          onClick={signOut}
          style={{ padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", background: "transparent", border: "1px solid #e2e8f0", borderRadius: 8 }}
        >
          Sign out
        </button>
      </div>

      <p style={{ marginBottom: 28, color: "#94a3b8", fontSize: 13 }}>{user?.email}</p>

      {pageError && (
        <p style={{ marginBottom: 16, padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, color: "#b91c1c", fontSize: 14 }}>
          {pageError}
        </p>
      )}

      {/* Add habit */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
          placeholder="New habit (e.g. Read 20 mins)"
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: 14,
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            background: "white",
            outline: "none",
            color: "#0f172a",
          }}
        />
        <button
          onClick={addHabit}
          disabled={adding || !newHabit.trim()}
          style={{
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: 10,
          }}
        >
          {adding ? "..." : "Add"}
        </button>
      </div>

      {/* Habit list */}
      {habits.length === 0 ? (
        <p style={{ opacity: 0.5 }}>No habits yet. Add one above to get started!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {habits.map((habit) => {
            const checkedInToday = habit.last_checked_in === today;
            return (
              <li
                key={habit.id}
                style={{
                  padding: "20px",
                  marginBottom: 16,
                  borderRadius: 16,
                  background: checkedInToday ? "#f0fdf4" : "#ffffff",
                  border: `1px solid ${checkedInToday ? "#bbf7d0" : "#e2e8f0"}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>{habit.name}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.45 }}>
                      🔥 {habit.streak} day streak
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => checkIn(habit)}
                      disabled={checkedInToday}
                      style={{
                        padding: "8px 14px",
                        cursor: checkedInToday ? "default" : "pointer",
                        background: checkedInToday ? "#d1fae5" : "#10b981",
                        color: checkedInToday ? "#059669" : "white",
                        border: `1px solid ${checkedInToday ? "#6ee7b7" : "transparent"}`,
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {checkedInToday ? "✓ Done" : "Check in"}
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      style={{
                        padding: "8px 10px",
                        cursor: "pointer",
                        background: "transparent",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        color: "#94a3b8",
                        fontSize: 13,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <HabitGrid completedDates={habit.completedDates} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
    </div>
  );
}
