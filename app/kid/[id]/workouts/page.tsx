"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Child = { id: string; name: string; avatar_emoji: string; parent_id: string };
type Workout = {
  id: string;
  title: string;
  subtitle: string | null;
  sport_tag: string | null;
  difficulty: string;
  exercises: { name: string; detail: string }[];
  is_shared?: boolean;
  parent_id?: string;
};
type Completion = {
  id: string;
  completed_at: string;
  weight_used: string | null;
  notes: string | null;
  workouts: { title: string; sport_tag: string | null } | null;
};

const XP_PER_WORKOUT = 30;

function parseSeconds(detail: string): number | null {
  const match = detail.match(/(\d+)\s*sec/i);
  return match ? parseInt(match[1], 10) : null;
}

export default function KidWorkoutsPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [child, setChild] = useState<Child | null>(null);
  const [tab, setTab] = useState<"library" | "history">("library");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [completedTodayIds, setCompletedTodayIds] = useState<Set<string>>(new Set());
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [weightUsed, setWeightUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerExerciseIdx, setTimerExerciseIdx] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const authed = sessionStorage.getItem(`kid-session-${childId}`);
    if (!authed) {
      router.push(`/kid/${childId}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  useEffect(() => {
    if (timerRunning && timerSeconds !== null && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => (s !== null ? s - 1 : null));
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning]);

  async function load() {
    setLoading(true);
    const { data: childData } = await supabase
      .from("children")
      .select("id, name, avatar_emoji, parent_id")
      .eq("id", childId)
      .single();
    setChild(childData);

    if (childData) {
      const { data: workoutData } = await supabase
        .from("workouts")
        .select("id, title, subtitle, sport_tag, difficulty, exercises, is_shared, parent_id")
        .or(`parent_id.eq.${childData.parent_id},is_shared.eq.true`)
        .order("created_at", { ascending: false });
      setWorkouts(workoutData || []);
    }

    await refreshCompletedToday();
    await refreshHistory();
    setLoading(false);
  }

  async function refreshCompletedToday() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("workout_completions")
      .select("workout_id")
      .eq("child_id", childId)
      .gte("completed_at", startOfDay.toISOString());
    setCompletedTodayIds(new Set((data || []).map((r: any) => r.workout_id)));
  }

  async function refreshHistory() {
    const { data } = await supabase
      .from("workout_completions")
      .select("id, completed_at, weight_used, notes, workouts(title, sport_tag)")
      .eq("child_id", childId)
      .order("completed_at", { ascending: false })
      .limit(30);
    setCompletions((data as any) || []);
  }

  function openWorkout(w: Workout) {
    setSelectedWorkout(w);
    setWeightUsed("");
    setNotes("");
    resetTimer();
  }

  function startTimer(idx: number, seconds: number) {
    setTimerExerciseIdx(idx);
    setTimerSeconds(seconds);
    setTimerRunning(true);
  }

  function pauseTimer() {
    setTimerRunning(false);
  }

  function resumeTimer() {
    if (timerSeconds && timerSeconds > 0) setTimerRunning(true);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(null);
    setTimerExerciseIdx(null);
  }

  async function completeWorkout() {
    if (!selectedWorkout) return;
    await supabase.from("workout_completions").insert({
      child_id: childId,
      workout_id: selectedWorkout.id,
      weight_used: weightUsed.trim() || null,
      notes: notes.trim() || null,
    });
    await supabase.from("xp_events").insert({ child_id: childId, source: "workout", amount: XP_PER_WORKOUT });
    await refreshCompletedToday();
    await refreshHistory();
    setSelectedWorkout(null);
    resetTimer();
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 900);
  }

  if (loading || !child) {
    return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading workouts…</main>;
  }

  return (
    <main className="min-h-screen px-5 py-6 max-w-md mx-auto">
      {celebrate && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="font-display font-bold text-lg text-plum">Workouts</div>
          <div className="text-xs text-plumsoft font-semibold">{child.name}'s library</div>
        </div>
        <button onClick={() => router.push(`/kid/${childId}/dashboard`)} className="text-xs font-bold text-plumsoft">
          ← Dashboard
        </button>
      </div>

      <div className="flex gap-2 bg-white rounded-full p-1 shadow mb-5 w-fit">
        <button
          onClick={() => setTab("library")}
          className={`text-xs font-display font-bold px-4 py-2 rounded-full ${
            tab === "library" ? "bg-plum text-white" : "text-plumsoft"
          }`}
        >
          Library
        </button>
        <button
          onClick={() => setTab("history")}
          className={`text-xs font-display font-bold px-4 py-2 rounded-full ${
            tab === "history" ? "bg-plum text-white" : "text-plumsoft"
          }`}
        >
          History
        </button>
      </div>

      {tab === "library" && (
        <div className="flex flex-col gap-3">
          {workouts.length === 0 && <p className="text-plumsoft text-sm text-center mt-6">No workouts yet — ask a grown-up to add some.</p>}
          {workouts.map((w) => {
            const done = completedTodayIds.has(w.id);
            return (
              <button
                key={w.id}
                onClick={() => openWorkout(w)}
                className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow text-left"
              >
                <div
                  className={`w-12 h-12 min-w-[3rem] rounded-full flex items-center justify-center text-xl border-2 ${
                    done ? "bg-grass border-grass text-white" : "bg-white border-cream"
                  }`}
                >
                  {done ? "✓" : "🏋️"}
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-sm text-plum">{w.title}</div>
                  <div className="text-xs text-plumsoft font-semibold">
                    {w.subtitle || `${w.exercises.length} exercises`}
                    {done ? " · Done today" : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {w.sport_tag && (
                    <span className="text-[9px] font-bold bg-sun/30 text-plum px-2 py-0.5 rounded-full">{w.sport_tag}</span>
                  )}
                  <span className="text-[9px] font-bold uppercase text-plumsoft">{w.difficulty}</span>
                  {w.is_shared && w.parent_id !== child.parent_id && (
                    <span className="text-[8px] font-bold text-sky">from another family</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "history" && (
        <div className="flex flex-col gap-2">
          {completions.length === 0 && <p className="text-plumsoft text-sm text-center mt-6">No workouts completed yet — go finish one!</p>}
          {completions.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-3.5 shadow">
              <div className="flex justify-between items-start">
                <div className="font-display font-bold text-sm text-plum">{c.workouts?.title || "Workout"}</div>
                <div className="text-[10px] text-plumsoft font-bold">
                  {new Date(c.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
              </div>
              {(c.weight_used || c.notes) && (
                <div className="text-xs text-plumsoft mt-1">
                  {c.weight_used && <span>Weight: {c.weight_used}</span>}
                  {c.weight_used && c.notes && " · "}
                  {c.notes && <span>{c.notes}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedWorkout && (
        <div
          className="fixed inset-0 bg-plum/40 flex items-end justify-center z-50"
          onClick={() => {
            setSelectedWorkout(null);
            resetTimer();
          }}
        >
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-display font-bold text-lg text-plum mb-0.5">{selectedWorkout.title}</div>
            {selectedWorkout.subtitle && <div className="text-xs text-plumsoft font-semibold mb-4">{selectedWorkout.subtitle}</div>}

            <div className="flex flex-col gap-2 mb-4">
              {selectedWorkout.exercises.map((ex, i) => {
                const secs = parseSeconds(ex.detail);
                const isActive = timerExerciseIdx === i;
                return (
                  <div key={i} className="bg-cream rounded-xl px-3 py-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-plum">{ex.name}</span>
                      <span className="text-xs font-bold text-plumsoft">{ex.detail}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {isActive && timerSeconds !== null ? (
                        <>
                          <span className="font-display font-extrabold text-2xl text-coral">{timerSeconds}s</span>
                          {timerRunning ? (
                            <button onClick={pauseTimer} className="text-xs font-bold bg-white px-3 py-1.5 rounded-full shadow">Pause</button>
                          ) : (
                            <button onClick={resumeTimer} className="text-xs font-bold bg-white px-3 py-1.5 rounded-full shadow">
                              {timerSeconds === 0 ? "Done!" : "Resume"}
                            </button>
                          )}
                          <button onClick={resetTimer} className="text-xs font-bold text-plumsoft px-2">Reset</button>
                        </>
                      ) : (
                        <button
                          onClick={() => startTimer(i, secs || 30)}
                          className="text-xs font-bold bg-sky text-white px-3 py-1.5 rounded-full"
                        >
                          ⏱ {secs ? `Start ${secs}s` : "Start timer"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <label className="text-[10px] font-bold text-plumsoft uppercase">Added weight? (optional)</label>
            <input
              className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-2 mt-1 text-sm font-semibold"
              placeholder="e.g. 5 lb dumbbells"
              value={weightUsed}
              onChange={(e) => setWeightUsed(e.target.value)}
            />
            <label className="text-[10px] font-bold text-plumsoft uppercase">Notes (optional)</label>
            <input
              className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
              placeholder="How'd it feel?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <button onClick={completeWorkout} className="w-full bg-coral text-white font-display font-bold py-3 rounded-xl mb-2">
              I finished this! (+{XP_PER_WORKOUT} XP)
            </button>
            <button
              onClick={() => {
                setSelectedWorkout(null);
                resetTimer();
              }}
              className="w-full text-plumsoft font-bold text-sm py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
