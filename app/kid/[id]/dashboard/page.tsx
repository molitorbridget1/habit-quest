"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Child = { id: string; name: string; avatar_emoji: string; parent_id: string };
type DailyLog = {
  id?: string;
  child_id: string;
  log_date: string;
  water_cups: number;
  movement_done: boolean;
  veggie_done: boolean;
  sleep_done: boolean;
  mood: string | null;
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const XP_PER_HABIT = 15;
const XP_STREAK_BONUS = 25;

export default function KidDashboard() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [child, setChild] = useState<Child | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authed = sessionStorage.getItem(`kid-session-${childId}`);
    if (!authed) {
      router.push(`/kid/${childId}`);
      return;
    }
    loadEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  async function loadEverything() {
    setLoading(true);
    const { data: childData } = await supabase
      .from("children")
      .select("id, name, avatar_emoji, parent_id")
      .eq("id", childId)
      .single();
    setChild(childData);

    let { data: logData } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("child_id", childId)
      .eq("log_date", todayStr())
      .maybeSingle();

    if (!logData) {
      const { data: created } = await supabase
        .from("daily_logs")
        .insert({ child_id: childId, log_date: todayStr() })
        .select()
        .single();
      logData = created;
    }
    setLog(logData);

    await refreshXp();
    await refreshStreak();
    setLoading(false);
  }

  async function refreshXp() {
    const { data } = await supabase.from("xp_events").select("amount").eq("child_id", childId);
    const total = (data || []).reduce((sum, r: any) => sum + r.amount, 0);
    setTotalXp(total);
  }

  async function refreshStreak() {
    const { data } = await supabase
      .from("daily_logs")
      .select("log_date, water_cups, movement_done, veggie_done, sleep_done")
      .eq("child_id", childId)
      .order("log_date", { ascending: false })
      .limit(30);

    if (!data) { setStreak(0); return; }
    let count = 0;
    let cursor = new Date();
    for (let i = 0; i < data.length; i++) {
      const expected = cursor.toISOString().slice(0, 10);
      const row = data.find((r: any) => r.log_date === expected);
      const anyDone = row && (row.water_cups > 0 || row.movement_done || row.veggie_done || row.sleep_done);
      if (anyDone) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (expected === todayStr()) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      } else {
        break;
      }
    }
    setStreak(count);
  }

  async function awardXp(source: string, amount: number) {
    await supabase.from("xp_events").insert({ child_id: childId, source, amount });
    await refreshXp();
  }

  async function toggleHabit(field: "movement_done" | "veggie_done" | "sleep_done") {
    if (!log) return;
    const newVal = !log[field];
    const updated = { ...log, [field]: newVal };
    setLog(updated);
    await supabase.from("daily_logs").update({ [field]: newVal }).eq("id", log.id);
    if (newVal) {
      await awardXp(field, XP_PER_HABIT);
      triggerCelebrate();
    }
  }

  async function addWater() {
    if (!log) return;
    const wasZero = log.water_cups === 0;
    const updated = { ...log, water_cups: log.water_cups + 1 };
    setLog(updated);
    await supabase.from("daily_logs").update({ water_cups: updated.water_cups }).eq("id", log.id);
    if (wasZero) {
      await awardXp("water", XP_PER_HABIT);
      triggerCelebrate();
    }
  }

  async function setMood(mood: string) {
    if (!log) return;
    setLog({ ...log, mood });
    await supabase.from("daily_logs").update({ mood }).eq("id", log.id);
  }

  function triggerCelebrate() {
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 900);
  }

  function handleSwitchProfile() {
    sessionStorage.removeItem(`kid-session-${childId}`);
    router.push("/kid");
  }

  if (loading || !child || !log) {
    return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading your adventure…</main>;
  }

  const level = Math.floor(totalXp / 100) + 1;
  const xpInLevel = totalXp % 100;
  const allDone = log.water_cups > 0 && log.movement_done && log.veggie_done && log.sleep_done;

  const nodes = [
    { key: "water", label: "Drink water", sub: `${log.water_cups} cup${log.water_cups === 1 ? "" : "s"}`, icon: "💧", done: log.water_cups > 0, onTap: addWater },
    { key: "veggie", label: "Eat a veggie", sub: log.veggie_done ? "Done today" : "Not yet", icon: "🥦", done: log.veggie_done, onTap: () => toggleHabit("veggie_done") },
    { key: "movement", label: "Move your body", sub: log.movement_done ? "Done today" : "Not yet", icon: "🏃", done: log.movement_done, onTap: () => toggleHabit("movement_done") },
    { key: "sleep", label: "Log good sleep", sub: log.sleep_done ? "Done today" : "Not yet", icon: "😴", done: log.sleep_done, onTap: () => toggleHabit("sleep_done") },
  ];

  return (
    <main className="min-h-screen px-5 py-6 max-w-md mx-auto">
      {celebrate && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-full bg-sun/40 flex items-center justify-center text-xl border-2 border-white shadow">
            {child.avatar_emoji}
          </div>
          <div>
            <div className="font-display font-bold text-plum text-sm">Hi, {child.name}!</div>
            <div className="text-xs text-plumsoft font-bold">Level {level} Explorer</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-full px-2.5 py-1 text-xs font-extrabold shadow">🔥 {streak}</div>
          <button onClick={handleSwitchProfile} className="text-[10px] font-bold text-plumsoft">Switch</button>
        </div>
      </div>

      <div className="h-3 bg-cream border border-plum/5 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-gradient-to-r from-grass to-sky rounded-full" style={{ width: `${xpInLevel}%` }} />
      </div>
      <div className="text-[11px] font-bold text-plumsoft mb-5">{xpInLevel} / 100 XP to Level {level + 1}</div>

      <div className="bg-white rounded-2xl p-3.5 shadow mb-5">
        <div className="text-xs font-display font-bold text-plumsoft mb-2">How do you feel today?</div>
        <div className="flex gap-2">
          {[
            { m: "sleepy", e: "😴" },
            { m: "meh", e: "😕" },
            { m: "good", e: "😊" },
            { m: "great", e: "🤩" },
          ].map((o) => (
            <button
              key={o.m}
              onClick={() => setMood(o.m)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${
                log.mood === o.m ? "bg-sun scale-110" : "bg-cream"
              }`}
            >
              {o.e}
            </button>
          ))}
        </div>
      </div>

      <div className="font-display font-bold text-plum text-sm mb-3">Today's Adventure</div>
      <div className="flex flex-col gap-3 mb-6">
        {nodes.map((n) => (
          <button
            key={n.key}
            onClick={n.onTap}
            className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow text-left"
          >
            <div
              className={`w-12 h-12 min-w-[3rem] rounded-full flex items-center justify-center text-xl border-2 ${
                n.done ? "bg-grass border-grass text-white" : "bg-white border-cream"
              }`}
            >
              {n.done ? "✓" : n.icon}
            </div>
            <div>
              <div className="font-display font-bold text-sm text-plum">{n.label}</div>
              <div className="text-xs text-plumsoft font-semibold">{n.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {allDone && (
        <div className="bg-gradient-to-r from-grass to-sky text-white rounded-2xl p-4 text-center shadow-lg mb-6">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-display font-bold">Adventure Complete!</div>
          <div className="text-xs opacity-90">You did every mission today. Amazing work.</div>
        </div>
      )}

      <button
        onClick={() => router.push(`/kid/${childId}/workouts`)}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow text-left mb-6"
      >
        <div className="w-12 h-12 min-w-[3rem] rounded-full bg-coral/15 flex items-center justify-center text-xl">🏋️</div>
        <div className="flex-1">
          <div className="font-display font-bold text-sm text-plum">Workout Library</div>
          <div className="text-xs text-plumsoft font-semibold">Browse, time, and log your workouts</div>
        </div>
        <span className="text-plumsoft text-lg">→</span>
      </button>

      <p className="text-center text-[10px] text-plumsoft/70 mt-4">
        Lessons are coming soon — this shows the daily habit loop.
      </p>
    </main>
  );
}
