"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Workout = {
  id: string;
  title: string;
  subtitle: string | null;
  sport_tag: string | null;
  difficulty: string;
  scheduled_days: string[];
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CoachChildSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.childId as string;

  const [childName, setChildName] = useState<string>("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }
    const { data: coached } = await supabase.rpc("get_coached_children");
    const match = (coached || []).find((c: any) => c.id === childId);
    setChildName(match?.name || "this kid");

    const { data } = await supabase
      .from("workouts")
      .select("id, title, subtitle, sport_tag, difficulty, scheduled_days")
      .eq("assigned_child_id", childId)
      .eq("parent_id", userData.user.id)
      .order("title", { ascending: true });
    setWorkouts((data as any) || []);
    setLoading(false);
  }

  async function toggleDay(workoutId: string, day: string) {
    const w = workouts.find((x) => x.id === workoutId);
    if (!w) return;
    const nextDays = (w.scheduled_days || []).includes(day)
      ? w.scheduled_days.filter((d) => d !== day)
      : [...(w.scheduled_days || []), day];
    setWorkouts(workouts.map((x) => (x.id === workoutId ? { ...x, scheduled_days: nextDays } : x)));
    await supabase.from("workouts").update({ scheduled_days: nextDays }).eq("id", workoutId);
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading…</main>;

  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-display text-xl font-bold text-plum">{childName}'s Schedule</h1>
        <Link href="/parent/coaching" className="text-xs font-bold text-plumsoft">← Coaching</Link>
      </div>
      <p className="text-xs text-plumsoft mb-6">Tap a day under any workout to add or remove it from that day's plan.</p>

      <Link
        href={`/parent/workouts/new?forChild=${childId}`}
        className="block text-center bg-coral text-white font-display font-bold py-3 rounded-xl mb-6"
      >
        + Build a new workout for {childName}
      </Link>

      {/* Week overview strip */}
      <div className="bg-white rounded-2xl p-4 shadow mb-6">
        <div className="text-xs font-display font-bold text-plumsoft mb-3">This week's plan</div>
        <div className="flex justify-between">
          {DAYS.map((d) => {
            const count = workouts.filter((w) => (w.scheduled_days || []).includes(d)).length;
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-plumsoft">{d}</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    count > 0 ? "bg-grass text-white" : "bg-cream text-plumsoft"
                  }`}
                >
                  {count > 0 ? count : "–"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {workouts.length === 0 && (
        <p className="text-plumsoft text-sm text-center">No workouts built for {childName} yet.</p>
      )}

      {workouts.map((w) => (
        <div key={w.id} className="bg-white rounded-2xl p-4 shadow mb-3">
          <div className="flex justify-between items-start mb-1">
            <div>
              <div className="font-display font-bold text-sm text-plum">{w.title}</div>
              {w.subtitle && <div className="text-xs text-plumsoft font-semibold">{w.subtitle}</div>}
            </div>
            <span className="text-[9px] font-bold uppercase text-plumsoft">{w.difficulty}</span>
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => toggleDay(w.id, d)}
                className={`text-[10px] font-bold w-9 h-8 rounded-lg border-2 ${
                  (w.scheduled_days || []).includes(d)
                    ? "bg-grass border-grass text-white"
                    : "bg-cream border-cream text-plumsoft"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
