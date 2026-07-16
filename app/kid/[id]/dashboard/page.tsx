"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ageBucket, getAgeCopy, computeAge } from "@/lib/ageCopy";

type Child = {
  id: string;
  name: string;
  avatar_emoji: string;
  parent_id: string;
  difficulty_filter: string | null;
  sport_tags: string[];
  coaching_mode: string;
  age: number;
  birthdate: string | null;
};
type DailyLog = {
  id?: string;
  child_id: string;
  log_date: string;
  water_cups: number;
  veggie_done: boolean;
  protein_selected: string[];
  mood: string | null;
};
type WorkoutTeaser = { id: string; title: string; subtitle: string | null };
type GameChoice = { text: string; correct: boolean };
type GameItem = { label: string; emoji: string; match: boolean };
type DailyGame = {
  id: string;
  game_type: "quiz" | "sort";
  question: string;
  choices: GameChoice[] | null;
  items: GameItem[] | null;
  explanation: string | null;
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const XP_PER_HABIT = 15;
const XP_PER_GAME = 10;

const PROTEIN_OPTIONS = [
  { key: "chicken", emoji: "🍗", label: "Chicken" },
  { key: "steak", emoji: "🥩", label: "Steak" },
  { key: "egg", emoji: "🥚", label: "Egg" },
  { key: "cheese", emoji: "🧀", label: "Cheese" },
  { key: "milk", emoji: "🥛", label: "Milk" },
  { key: "yogurt", emoji: "🥣", label: "Yogurt" },
];

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

  const [weekHabitDays, setWeekHabitDays] = useState(0);
  const [weekWorkouts, setWeekWorkouts] = useState(0);
  const [upNext, setUpNext] = useState<WorkoutTeaser | null>(null);

  const [game, setGame] = useState<DailyGame | null>(null);
  const [gameDone, setGameDone] = useState(false);
  const [gameFeedback, setGameFeedback] = useState<{ correct: boolean; explanation: string | null } | null>(null);
  const [selectedSortItems, setSelectedSortItems] = useState<Set<number>>(new Set());

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
      .select("id, name, avatar_emoji, parent_id, difficulty_filter, sport_tags, coaching_mode, age, birthdate")
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
    await loadWeekSummary();
    if (childData) await loadUpNext(childData);
    if (childData) await loadDailyGame(childData);
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
      .select("log_date, water_cups, veggie_done, protein_selected")
      .eq("child_id", childId)
      .order("log_date", { ascending: false })
      .limit(30);

    if (!data) { setStreak(0); return; }
    let count = 0;
    let cursor = new Date();
    for (let i = 0; i < data.length; i++) {
      const expected = cursor.toISOString().slice(0, 10);
      const row = data.find((r: any) => r.log_date === expected);
      const anyDone = row && (row.water_cups > 0 || row.veggie_done || (row.protein_selected || []).length > 0);
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

  async function loadWeekSummary() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("water_cups, veggie_done, protein_selected")
      .eq("child_id", childId)
      .gte("log_date", sevenDaysAgo.toISOString().slice(0, 10));
    const daysWithHabit = (logs || []).filter(
      (l: any) => l.water_cups > 0 || l.veggie_done || (l.protein_selected || []).length > 0
    ).length;
    setWeekHabitDays(daysWithHabit);

    const { count } = await supabase
      .from("workout_completions")
      .select("id", { count: "exact", head: true })
      .eq("child_id", childId)
      .gte("completed_at", sevenDaysAgo.toISOString());
    setWeekWorkouts(count || 0);
  }

  async function loadUpNext(childData: Child) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: completedToday } = await supabase
      .from("workout_completions")
      .select("workout_id")
      .eq("child_id", childId)
      .gte("completed_at", startOfDay.toISOString());
    const doneIds = new Set((completedToday || []).map((r: any) => r.workout_id));

    let candidates: any[] = [];

    if (childData.coaching_mode === "coach_bee" || childData.coaching_mode === "coach_erick") {
      const coachKey = childData.coaching_mode === "coach_bee" ? "bee" : "erick";
      const { data } = await supabase
        .from("workouts")
        .select("id, title, subtitle, difficulty, sport_tag")
        .eq("coach_type", coachKey);
      candidates = data || [];
    } else if (childData.coaching_mode === "invite_coach") {
      const { data } = await supabase
        .from("workouts")
        .select("id, title, subtitle, difficulty, sport_tag")
        .eq("assigned_child_id", childId);
      candidates = data || [];
    } else {
      const { data } = await supabase
        .from("workouts")
        .select("id, title, subtitle, difficulty, sport_tag, parent_id, is_shared, coach_type, assigned_child_id")
        .or(`parent_id.eq.${childData.parent_id},and(is_shared.eq.true,coach_type.is.null)`)
        .order("created_at", { ascending: true });
      const kidSports = childData.sport_tags || [];
      candidates = (data || [])
        .filter((w: any) => w.parent_id !== childData.parent_id || !w.assigned_child_id || w.assigned_child_id === childId)
        .filter((w: any) => (kidSports.length > 0 ? kidSports.includes(w.sport_tag) : !w.sport_tag));
    }

    candidates = candidates.filter((w: any) => !doneIds.has(w.id));
    if (childData.difficulty_filter) {
      const matching = candidates.filter((w: any) => w.difficulty === childData.difficulty_filter);
      if (matching.length > 0) candidates = matching;
    }
    setUpNext(candidates[0] || null);
  }

  async function loadDailyGame(childData: Child) {
    const tier = computeAge(childData.birthdate, childData.age) <= 10 ? "younger" : "older";
    const { data: games } = await supabase
      .from("daily_games")
      .select("id, game_type, question, choices, items, explanation")
      .or(`age_tier.is.null,age_tier.eq.${tier}`);
    if (!games || games.length === 0) return;
    const dayIndex = Math.floor(Date.now() / 86400000) % games.length;
    const todaysGame = games[dayIndex] as any;
    setGame(todaysGame);

    const { data: completion } = await supabase
      .from("game_completions")
      .select("was_correct")
      .eq("child_id", childId)
      .eq("completed_date", todayStr())
      .maybeSingle();

    if (completion) {
      setGameDone(true);
      setGameFeedback({ correct: completion.was_correct, explanation: todaysGame.explanation });
    }
  }

  async function answerGame(choice: GameChoice) {
    if (!game || gameDone) return;
    setGameFeedback({ correct: choice.correct, explanation: game.explanation });
    setGameDone(true);
    await supabase.from("game_completions").insert({
      child_id: childId,
      game_id: game.id,
      completed_date: todayStr(),
      was_correct: choice.correct,
    });
    await awardXp("daily_game", XP_PER_GAME);
    if (choice.correct) triggerCelebrate();
  }

  function toggleSortItem(i: number) {
    if (gameDone) return;
    const next = new Set(selectedSortItems);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelectedSortItems(next);
  }

  async function submitSortGame() {
    if (!game || gameDone || !game.items) return;
    const allCorrect = game.items.every((it, i) => selectedSortItems.has(i) === it.match);
    setGameFeedback({ correct: allCorrect, explanation: game.explanation });
    setGameDone(true);
    await supabase.from("game_completions").insert({
      child_id: childId,
      game_id: game.id,
      completed_date: todayStr(),
      was_correct: allCorrect,
    });
    await awardXp("daily_game", XP_PER_GAME);
    if (allCorrect) triggerCelebrate();
  }

  async function awardXp(source: string, amount: number) {
    await supabase.from("xp_events").insert({ child_id: childId, source, amount });
    await refreshXp();
  }

  async function toggleVeggie() {
    if (!log) return;
    const newVal = !log.veggie_done;
    const updated = { ...log, veggie_done: newVal };
    setLog(updated);
    await supabase.from("daily_logs").update({ veggie_done: newVal }).eq("id", log.id);
    if (newVal) {
      await awardXp("veggie_done", XP_PER_HABIT);
      triggerCelebrate();
    }
  }

  async function toggleProtein(key: string) {
    if (!log) return;
    const current = log.protein_selected || [];
    const wasEmpty = current.length === 0;
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    const updated = { ...log, protein_selected: next };
    setLog(updated);
    await supabase.from("daily_logs").update({ protein_selected: next }).eq("id", log.id);
    if (wasEmpty && next.length > 0) {
      await awardXp("protein", XP_PER_HABIT);
      triggerCelebrate();
    }
  }

  async function adjustWater(delta: number) {
    if (!log) return;
    const wasZero = log.water_cups === 0;
    const newCups = Math.max(0, log.water_cups + delta);
    const updated = { ...log, water_cups: newCups };
    setLog(updated);
    await supabase.from("daily_logs").update({ water_cups: newCups }).eq("id", log.id);
    if (wasZero && newCups > 0) {
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
  const allDone = log.water_cups > 0 && log.veggie_done && (log.protein_selected || []).length > 0;
  const copy = getAgeCopy(ageBucket(computeAge(child.birthdate, child.age)));

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
            <div className="text-xs text-plumsoft font-bold">Level {level}{copy.levelSuffix}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-full px-2.5 py-1 text-xs font-extrabold shadow">🔥 {streak}</div>
          <button onClick={() => router.push("/parent")} className="text-[10px] font-bold text-plumsoft">Parent</button>
          <button onClick={handleSwitchProfile} className="text-[10px] font-bold text-plumsoft">Switch</button>
        </div>
      </div>

      <div className="h-3 bg-cream border border-plum/5 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-gradient-to-r from-grass to-sky rounded-full" style={{ width: `${xpInLevel}%` }} />
      </div>
      <div className="text-[11px] font-bold text-plumsoft mb-5">{xpInLevel} / 100 XP to Level {level + 1}</div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-3.5 shadow text-center">
          <div className="font-display font-extrabold text-2xl text-grass">{weekHabitDays}/7</div>
          <div className="text-[10px] text-plumsoft font-bold">habit days this week</div>
        </div>
        <div className="bg-white rounded-2xl p-3.5 shadow text-center">
          <div className="font-display font-extrabold text-2xl text-coral">{weekWorkouts}</div>
          <div className="text-[10px] text-plumsoft font-bold">workouts this week</div>
        </div>
      </div>

      {upNext && (
        <button
          onClick={() => router.push(`/kid/${childId}/workouts/${upNext.id}`)}
          className="w-full flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow text-left mb-5"
        >
          <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-sky/20 flex items-center justify-center text-lg">⏭️</div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-plumsoft uppercase">Up next</div>
            <div className="font-display font-bold text-sm text-plum">{upNext.title}</div>
          </div>
        </button>
      )}

      {game && (
        <div className="bg-white rounded-2xl p-4 shadow mb-5">
          <div className="text-xs font-display font-bold text-plumsoft mb-2">
            🎮 Today's {game.game_type === "sort" ? "Tap & Sort" : "Brain Game"}
          </div>
          <div className="text-sm font-bold text-plum mb-3">{game.question}</div>

          {!gameDone ? (
            game.game_type === "sort" && game.items ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {game.items.map((it, i) => (
                    <button
                      key={i}
                      onClick={() => toggleSortItem(i)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-3 border-2 ${
                        selectedSortItems.has(i) ? "bg-sun/30 border-sun" : "bg-cream border-cream"
                      }`}
                    >
                      <span className="text-xl">{it.emoji}</span>
                      <span className="text-[10px] font-bold text-plum text-center px-1">{it.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={submitSortGame}
                  className="w-full bg-coral text-white font-display font-bold py-2.5 rounded-xl text-sm"
                >
                  Submit
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                {(game.choices || []).map((c, i) => (
                  <button
                    key={i}
                    onClick={() => answerGame(c)}
                    className="text-left text-sm font-bold bg-cream rounded-xl px-3 py-2.5"
                  >
                    {c.text}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${gameFeedback?.correct ? "bg-grass/15 text-plum" : "bg-sun/20 text-plum"}`}>
              {gameFeedback?.correct ? "Nice job! " : "Good try! "}
              {gameFeedback?.explanation}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl p-3.5 shadow mb-5">
        <div className="text-xs font-display font-bold text-plumsoft mb-2">{copy.moodPrompt}</div>
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

      <div className="font-display font-bold text-plum text-sm mb-3">{copy.sectionTitle}</div>

      <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow mb-3">
        <div
          className={`w-12 h-12 min-w-[3rem] rounded-full flex items-center justify-center text-xl border-2 ${
            log.water_cups > 0 ? "bg-grass border-grass text-white" : "bg-white border-cream"
          }`}
        >
          {log.water_cups > 0 ? "✓" : "💧"}
        </div>
        <div className="flex-1">
          <div className="font-display font-bold text-sm text-plum">Drink water</div>
          <div className="text-xs text-plumsoft font-semibold">{log.water_cups} cup{log.water_cups === 1 ? "" : "s"}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => adjustWater(-1)} className="w-8 h-8 rounded-full bg-cream font-display font-bold text-plum">−</button>
          <button onClick={() => adjustWater(1)} className="w-8 h-8 rounded-full bg-sky text-white font-display font-bold">+</button>
        </div>
      </div>

      <button
        onClick={toggleVeggie}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow text-left mb-3"
      >
        <div
          className={`w-12 h-12 min-w-[3rem] rounded-full flex items-center justify-center text-xl border-2 ${
            log.veggie_done ? "bg-grass border-grass text-white" : "bg-white border-cream"
          }`}
        >
          {log.veggie_done ? "✓" : "🥦"}
        </div>
        <div>
          <div className="font-display font-bold text-sm text-plum">Eat a veggie</div>
          <div className="text-xs text-plumsoft font-semibold">{log.veggie_done ? "Done today" : "Not yet"}</div>
        </div>
      </button>

      <div className="bg-white rounded-2xl p-3.5 shadow mb-6">
        <div className="font-display font-bold text-sm text-plum mb-0.5">What protein did you have today?</div>
        <div className="text-xs text-plumsoft font-semibold mb-3">Pick all that apply</div>
        <div className="flex gap-2.5 flex-wrap">
          {PROTEIN_OPTIONS.map((p) => {
            const selected = (log.protein_selected || []).includes(p.key);
            return (
              <button
                key={p.key}
                onClick={() => toggleProtein(p.key)}
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 ${
                  selected ? "bg-grass/20 border-grass" : "bg-cream border-cream"
                }`}
              >
                <span className="text-lg">{p.emoji}</span>
              </button>
            );
          })}
        </div>
      </div>

      {allDone && (
        <div className="bg-gradient-to-r from-grass to-sky text-white rounded-2xl p-4 text-center shadow-lg mb-6">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-display font-bold">{copy.adventureComplete}</div>
          <div className="text-xs opacity-90">{copy.adventureCompleteSub}</div>
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
