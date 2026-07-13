"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Workout = {
  id: string;
  title: string;
  subtitle: string | null;
  sport_tag: string | null;
  difficulty: string;
  is_shared: boolean;
  exercises: { name: string; detail: string }[];
};

export default function WorkoutsPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }
    const { data } = await supabase
      .from("workouts")
      .select("id, title, subtitle, sport_tag, difficulty, is_shared, exercises")
      .eq("parent_id", userData.user.id)
      .order("created_at", { ascending: false });
    setWorkouts(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this workout? Kids won't see it anymore.")) return;
    await supabase.from("workouts").delete().eq("id", id);
    load();
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading…</main>;

  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-xl font-bold text-plum">Your workouts</h1>
        <Link href="/parent" className="text-xs font-bold text-plumsoft">← Back</Link>
      </div>

      <Link
        href="/parent/workouts/new"
        className="block text-center bg-coral text-white font-display font-bold py-3 rounded-xl mb-6"
      >
        + Build a new workout
      </Link>

      {workouts.length === 0 && (
        <p className="text-plumsoft text-sm text-center">No workouts yet — build your first one above.</p>
      )}

      {workouts.map((w) => (
        <div key={w.id} className="bg-white rounded-2xl p-4 shadow mb-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-display font-bold text-plum">{w.title}</div>
              {w.subtitle && <div className="text-xs text-plumsoft font-semibold">{w.subtitle}</div>}
            </div>
            {w.sport_tag && (
              <span className="text-[10px] font-bold bg-sun/30 text-plum px-2 py-1 rounded-full">{w.sport_tag}</span>
            )}
          </div>
          <span className="inline-block text-[9px] font-bold uppercase text-plumsoft mt-1">{w.difficulty}</span>
          {w.is_shared && (
            <span className="inline-block text-[9px] font-bold text-sky ml-2">🌐 Shared with all families</span>
          )}
          <div className="mt-2 text-xs text-plumsoft">
            {w.exercises.map((e, i) => (
              <span key={i}>
                {e.name} ({e.detail}){i < w.exercises.length - 1 ? " · " : ""}
              </span>
            ))}
          </div>
          <button
            onClick={() => handleDelete(w.id)}
            className="text-[10px] font-bold text-coral mt-3"
          >
            Delete
          </button>
        </div>
      ))}
    </main>
  );
}
