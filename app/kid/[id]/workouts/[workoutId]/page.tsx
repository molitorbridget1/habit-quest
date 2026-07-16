"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ageBucket, getAgeCopy, computeAge } from "@/lib/ageCopy";

type Workout = {
  id: string;
  title: string;
  subtitle: string | null;
  sport_tag: string | null;
  difficulty: string;
  exercises: { name: string; detail: string; sets?: number; rest_seconds?: number }[];
  video_url: string | null;
};

const XP_PER_WORKOUT = 30;

function parseSeconds(detail: string): number | null {
  const match = detail.match(/(\d+)\s*sec/i);
  return match ? parseInt(match[1], 10) : null;
}

export default function WorkoutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;
  const workoutId = params.workoutId as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [copy, setCopy] = useState(getAgeCopy("8-10"));
  const [lastWeight, setLastWeight] = useState<string | null>(null);
  const [weightUsed, setWeightUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [completedSets, setCompletedSets] = useState<Record<number, number>>({});

  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerExerciseIdx, setTimerExerciseIdx] = useState<number | null>(null);
  const [isRest, setIsRest] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const authed = sessionStorage.getItem(`kid-session-${childId}`);
    if (!authed) {
      router.push(`/kid/${childId}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, workoutId]);

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
    const { data: workoutData } = await supabase
      .from("workouts")
      .select("id, title, subtitle, sport_tag, difficulty, exercises, video_url")
      .eq("id", workoutId)
      .single();
    setWorkout(workoutData as any);

    const { data: childData } = await supabase.from("children").select("age, birthdate").eq("id", childId).single();
    if (childData) setCopy(getAgeCopy(ageBucket(computeAge(childData.birthdate, childData.age))));

    const { data: lastCompletion } = await supabase
      .from("workout_completions")
      .select("weight_used")
      .eq("child_id", childId)
      .eq("workout_id", workoutId)
      .not("weight_used", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastCompletion?.weight_used) {
      setLastWeight(lastCompletion.weight_used);
      setWeightUsed(lastCompletion.weight_used);
    }
    setLoading(false);
  }

  function startTimer(idx: number, seconds: number, rest = false) {
    setTimerExerciseIdx(idx);
    setTimerSeconds(seconds);
    setTimerRunning(true);
    setIsRest(rest);
  }
  function pauseTimer() { setTimerRunning(false); }
  function resumeTimer() { if (timerSeconds && timerSeconds > 0) setTimerRunning(true); }
  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(null);
    setTimerExerciseIdx(null);
    setIsRest(false);
  }

  function markSetDone(idx: number, totalSets: number, restSeconds?: number) {
    const done = (completedSets[idx] || 0) + 1;
    setCompletedSets({ ...completedSets, [idx]: done });
    if (done < totalSets && restSeconds) {
      startTimer(idx, restSeconds, true);
    } else {
      resetTimer();
    }
  }

  async function completeWorkout() {
    if (!workout) return;
    setSaving(true);
    await supabase.from("workout_completions").insert({
      child_id: childId,
      workout_id: workout.id,
      weight_used: weightUsed.trim() || null,
      notes: notes.trim() || null,
    });
    await supabase.from("xp_events").insert({ child_id: childId, source: "workout", amount: XP_PER_WORKOUT });
    setSaving(false);
    setJustCompleted(true);
    setTimeout(() => router.push(`/kid/${childId}/workouts`), 1400);
  }

  if (loading || !workout) {
    return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading workout…</main>;
  }

  if (justCompleted) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <div className="font-display font-bold text-xl text-plum mb-1">{copy.workoutCompleteHeadline}</div>
        <div className="text-sm text-plumsoft font-semibold">+{XP_PER_WORKOUT} XP earned</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-6 max-w-md mx-auto">
      <button
        onClick={() => router.push(`/kid/${childId}/workouts`)}
        className="text-xs font-bold text-plumsoft mb-4"
      >
        ← Back to Workouts
      </button>

      <div className="font-display font-bold text-2xl text-plum mb-0.5">{workout.title}</div>
      {workout.subtitle && <div className="text-sm text-plumsoft font-semibold mb-1">{workout.subtitle}</div>}
      <div className="flex gap-2 mb-5">
        {workout.sport_tag && (
          <span className="text-[10px] font-bold bg-sun/30 text-plum px-2.5 py-1 rounded-full">{workout.sport_tag}</span>
        )}
        <span className="text-[10px] font-bold uppercase bg-cream text-plumsoft px-2.5 py-1 rounded-full">{workout.difficulty}</span>
      </div>

      {workout.video_url && (
        <a
          href={workout.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-sky text-white font-display font-bold py-3 rounded-xl mb-5"
        >
          ▶ Watch how-to video
        </a>
      )}

      <div className="flex flex-col gap-2.5 mb-6">
        {workout.exercises.map((ex, i) => {
          const secs = parseSeconds(ex.detail);
          const isActive = timerExerciseIdx === i;
          const totalSets = ex.sets || 1;
          const doneSets = completedSets[i] || 0;
          return (
            <div key={i} className="bg-white rounded-2xl p-4 shadow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-plum">{ex.name}</span>
                <span className="text-xs font-bold text-plumsoft">{ex.detail}</span>
              </div>

              {totalSets > 1 && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  {Array.from({ length: totalSets }).map((_, s) => (
                    <div
                      key={s}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        s < doneSets ? "bg-grass text-white" : "bg-cream text-plumsoft"
                      }`}
                    >
                      {s < doneSets ? "✓" : s + 1}
                    </div>
                  ))}
                  {doneSets < totalSets && (
                    <button
                      onClick={() => markSetDone(i, totalSets, ex.rest_seconds)}
                      className="text-[11px] font-bold bg-plum text-white px-3 py-1.5 rounded-full ml-1"
                    >
                      Mark set {doneSets + 1} done
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                {isActive && timerSeconds !== null ? (
                  <>
                    <span className={`font-display font-extrabold text-3xl ${isRest ? "text-sky" : "text-coral"}`}>
                      {isRest ? `Rest ${timerSeconds}s` : `${timerSeconds}s`}
                    </span>
                    {timerRunning ? (
                      <button onClick={pauseTimer} className="text-xs font-bold bg-cream px-3 py-1.5 rounded-full">Pause</button>
                    ) : (
                      <button onClick={resumeTimer} className="text-xs font-bold bg-cream px-3 py-1.5 rounded-full">
                        {timerSeconds === 0 ? "Done!" : "Resume"}
                      </button>
                    )}
                    <button onClick={resetTimer} className="text-xs font-bold text-plumsoft px-2">Reset</button>
                  </>
                ) : (
                  totalSets <= 1 && (
                    <button
                      onClick={() => startTimer(i, secs || 30)}
                      className="text-xs font-bold bg-sky text-white px-3 py-1.5 rounded-full"
                    >
                      ⏱ {secs ? `Start ${secs}s` : "Start timer"}
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow mb-6">
        <label className="text-[10px] font-bold text-plumsoft uppercase">Added weight? (optional)</label>
        {lastWeight && (
          <div className="text-[11px] text-sky font-semibold mt-0.5 mb-1.5">Last time: {lastWeight}</div>
        )}
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-3 mt-1 text-sm font-semibold"
          placeholder="e.g. 5 lb dumbbells"
          value={weightUsed}
          onChange={(e) => setWeightUsed(e.target.value)}
        />
        <label className="text-[10px] font-bold text-plumsoft uppercase">Notes (optional)</label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mt-1 text-sm font-semibold"
          placeholder="How'd it feel?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        onClick={completeWorkout}
        disabled={saving}
        className="w-full bg-coral text-white font-display font-bold py-3.5 rounded-xl disabled:opacity-60"
      >
        {saving ? "Saving…" : `I finished this! (+${XP_PER_WORKOUT} XP)`}
      </button>
    </main>
  );
}
