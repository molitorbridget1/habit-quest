"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { computeAge } from "@/lib/ageCopy";

type Child = {
  id: string;
  name: string;
  avatar_emoji: string;
  parent_id: string;
  age: number;
  birthdate: string | null;
  coaching_mode: string;
  difficulty_filter: string | null;
  sport_tags: string[];
};
type Workout = {
  id: string;
  title: string;
  subtitle: string | null;
  sport_tag: string | null;
  difficulty: string;
  exercises: { name: string; detail: string }[];
  is_shared?: boolean;
  parent_id?: string;
  age_groups?: string[];
  coach_type?: string | null;
  video_url?: string | null;
};
type Completion = {
  id: string;
  completed_at: string;
  weight_used: string | null;
  notes: string | null;
  workouts: { title: string; sport_tag: string | null } | null;
};

const WORKOUT_SELECT = "id, title, subtitle, sport_tag, difficulty, exercises, is_shared, parent_id, age_groups, coach_type, video_url";

function ageBucket(age: number): string {
  if (age <= 7) return "5-7";
  if (age <= 10) return "8-10";
  if (age <= 13) return "11-13";
  return "14-18";
}

function getWeekDates(): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function KidWorkoutsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-plumsoft">Loading…</main>}>
      <KidWorkoutsInner />
    </Suspense>
  );
}

function KidWorkoutsInner() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [child, setChild] = useState<Child | null>(null);
  const [tab, setTab] = useState<"library" | "history">("library");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [completedTodayIds, setCompletedTodayIds] = useState<Set<string>>(new Set());
  const [weekCompletedDates, setWeekCompletedDates] = useState<Set<string>>(new Set());
  const [filterChoice, setFilterChoice] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authed = sessionStorage.getItem(`kid-session-${childId}`);
    if (!authed) {
      router.push(`/kid/${childId}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  async function load() {
    setLoading(true);
    const { data: childData } = await supabase
      .from("children")
      .select("id, name, avatar_emoji, parent_id, age, birthdate, coaching_mode, difficulty_filter, sport_tags")
      .eq("id", childId)
      .single();
    setChild(childData);
    setFilterChoice(childData?.difficulty_filter || "all");

    if (childData) {
      let results: any[] = [];

      if (childData.coaching_mode === "coach_bee" || childData.coaching_mode === "coach_erick") {
        // Coach persona selected: show ONLY that coach's library, nothing else
        const coachKey = childData.coaching_mode === "coach_bee" ? "bee" : "erick";
        const r = await supabase.from("workouts").select(WORKOUT_SELECT).eq("coach_type", coachKey);
        results = [r];
      } else if (childData.coaching_mode === "invite_coach") {
        // Real coach linked: show ONLY workouts that coach built specifically for this kid
        const r = await supabase.from("workouts").select(WORKOUT_SELECT).eq("assigned_child_id", childId);
        results = [r];
      } else {
        // Parent Lead: their own workouts plus the general (non-coach) shared library
        const ownQuery = supabase
          .from("workouts")
          .select(WORKOUT_SELECT)
          .eq("parent_id", childData.parent_id)
          .or(`assigned_child_id.is.null,assigned_child_id.eq.${childId}`);
        const sharedQuery = supabase.from("workouts").select(WORKOUT_SELECT).eq("is_shared", true).is("coach_type", null);
        results = await Promise.all([ownQuery, sharedQuery]);
      }

      const merged = new Map<string, Workout>();
      results.forEach((r) => (r.data || []).forEach((w: any) => merged.set(w.id, w)));

      const bucket = ageBucket(computeAge(childData.birthdate, childData.age));
      const kidSports = childData.sport_tags || [];
      let finalList = Array.from(merged.values());

      if (childData.coaching_mode !== "invite_coach") {
        finalList = finalList.filter((w) => !w.age_groups || w.age_groups.length === 0 || w.age_groups.includes(bucket));
        finalList = finalList.filter((w) => (kidSports.length > 0 ? w.sport_tag && kidSports.includes(w.sport_tag) : !w.sport_tag));
      }
      // invite_coach workouts are hand-assigned to this exact kid by their coach,
      // so we show all of them as-is rather than auto-filtering by sport/age.

      finalList.sort((a, b) => a.title.localeCompare(b.title));
      setWorkouts(finalList);
    }

    await refreshCompletedToday();
    await refreshHistory();
    await refreshWeek();
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

  async function refreshWeek() {
    const weekDates = getWeekDates();
    const start = weekDates[0];
    const end = new Date(weekDates[6]);
    end.setHours(23, 59, 59, 999);
    const { data } = await supabase
      .from("workout_completions")
      .select("completed_at")
      .eq("child_id", childId)
      .gte("completed_at", start.toISOString())
      .lte("completed_at", end.toISOString());
    const dateSet = new Set((data || []).map((r: any) => new Date(r.completed_at).toDateString()));
    setWeekCompletedDates(dateSet);
  }

  async function updateFilter(choice: string) {
    setFilterChoice(choice);
    await supabase.from("children").update({ difficulty_filter: choice === "all" ? null : choice }).eq("id", childId);
  }

  if (loading || !child) {
    return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading workouts…</main>;
  }

  const weekDates = getWeekDates();
  const todayStr = new Date().toDateString();

  return (
    <main className="min-h-screen px-5 py-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="font-display font-bold text-lg text-plum">Workouts</div>
          <div className="text-xs text-plumsoft font-semibold">{child.name}'s library</div>
        </div>
        <button onClick={() => router.push(`/kid/${childId}/dashboard`)} className="text-xs font-bold text-plumsoft">
          ← Dashboard
        </button>
      </div>
      <div className="text-right -mt-1 mb-4">
        <button onClick={() => router.push("/parent")} className="text-[10px] font-bold text-plumsoft">
          Parent view →
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow mb-5">
        <div className="text-xs font-display font-bold text-plumsoft mb-3">This week</div>
        <div className="flex justify-between">
          {weekDates.map((d, i) => {
            const done = weekCompletedDates.has(d.toDateString());
            const isToday = d.toDateString() === todayStr;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-plumsoft">{DAY_LABELS[i]}</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    done
                      ? "bg-grass text-white"
                      : isToday
                      ? "bg-cream border-2 border-coral text-plum"
                      : "bg-cream text-plumsoft"
                  }`}
                >
                  {done ? "✓" : d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 bg-white rounded-full p-1 shadow mb-5 w-fit">
        <button
          onClick={() => setTab("library")}
          className={`text-xs font-display font-bold px-4 py-2 rounded-full ${tab === "library" ? "bg-plum text-white" : "text-plumsoft"}`}
        >
          Library
        </button>
        <button
          onClick={() => setTab("history")}
          className={`text-xs font-display font-bold px-4 py-2 rounded-full ${tab === "history" ? "bg-plum text-white" : "text-plumsoft"}`}
        >
          History
        </button>
      </div>

      {tab === "library" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap mb-1">
            {["all", "beginner", "intermediate", "advanced"].map((f) => (
              <button
                key={f}
                onClick={() => updateFilter(f)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border-2 capitalize ${
                  filterChoice === f ? "bg-plum border-plum text-white" : "bg-white border-cream text-plumsoft"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {workouts.filter((w) => filterChoice === "all" || w.difficulty === filterChoice).length === 0 && (
            <p className="text-plumsoft text-sm text-center mt-6">No workouts match this filter yet.</p>
          )}
          {workouts
            .filter((w) => filterChoice === "all" || w.difficulty === filterChoice)
            .map((w) => {
              const done = completedTodayIds.has(w.id);
              return (
                <button
                  key={w.id}
                  onClick={() => router.push(`/kid/${childId}/workouts/${w.id}`)}
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
                    {w.video_url && <span className="text-[9px]">🎥</span>}
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
    </main>
  );
}
