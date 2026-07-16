"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Exercise = { name: string; detail: string; sets?: number; rest_seconds?: number };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SPORT_TAGS = ["General", "Baseball", "Soccer", "Basketball", "Football", "Gymnastics", "Swimming", "Golf", "Wrestling", "Volleyball", "Cheerleading", "Dance", "Track & Field", "Cross Country"];
const DIFFICULTIES = [
  { key: "beginner", label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
];
const AGE_GROUPS = ["5-7", "8-10", "11-13", "14-18"];
const COACH_TYPES = [
  { key: "", label: "None" },
  { key: "bee", label: "Coach Bee" },
  { key: "erick", label: "Coach Erick" },
];

export default function NewWorkoutPageWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-plumsoft">Loading…</main>}>
      <NewWorkoutPage />
    </Suspense>
  );
}

function NewWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forChild = searchParams.get("forChild");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [sportTag, setSportTag] = useState("General");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [isShared, setIsShared] = useState(false);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [coachType, setCoachType] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [childName, setChildName] = useState<string | null>(null);
  const [scheduledDays, setScheduledDays] = useState<string[]>([]);
  const [ownKids, setOwnKids] = useState<{ id: string; name: string; avatar_emoji: string }[]>([]);
  const [coachedKids, setCoachedKids] = useState<{ id: string; name: string }[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>("all");

  function toggleDay(d: string) {
    setScheduledDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: parentRow } = await supabase.from("parents").select("is_admin").eq("id", userData.user.id).single();
      setIsAdmin(!!parentRow?.is_admin);

      const { data: coached } = await supabase.rpc("get_coached_children");
      setCoachedKids((coached || []).map((c: any) => ({ id: c.id, name: c.name })));

      if (forChild) {
        const match = (coached || []).find((c: any) => c.id === forChild);
        setChildName(match?.name || "this child");
      } else {
        const { data: kids } = await supabase
          .from("children")
          .select("id, name, avatar_emoji")
          .eq("parent_id", userData.user.id);
        setOwnKids(kids || []);
      }
    })();
  }, [forChild]);

  function toggleAgeGroup(ag: string) {
    setAgeGroups((prev) => (prev.includes(ag) ? prev.filter((a) => a !== ag) : [...prev, ag]));
  }
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", detail: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateExercise(i: number, field: "name" | "detail", value: string) {
    const next = [...exercises];
    next[i][field] = value;
    setExercises(next);
  }

  function updateExerciseNumber(i: number, field: "sets" | "rest_seconds", value: string) {
    const next = [...exercises];
    const num = value === "" ? undefined : parseInt(value, 10);
    next[i][field] = num;
    setExercises(next);
  }

  function addExercise() {
    setExercises([...exercises, { name: "", detail: "" }]);
  }

  function removeExercise(i: number) {
    setExercises(exercises.filter((_, idx) => idx !== i));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not logged in.");

      const cleanExercises = exercises.filter((ex) => ex.name.trim() !== "");
      if (cleanExercises.length === 0) throw new Error("Add at least one exercise.");
      if (!title.trim()) throw new Error("Give the workout a name.");

      const targetChildId = forChild || (selectedTarget !== "all" ? selectedTarget : null);
      const isSpecificTarget = !!targetChildId;

      const { error: insertError } = await supabase.from("workouts").insert({
        parent_id: userData.user.id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        sport_tag: sportTag === "General" ? null : sportTag,
        difficulty,
        is_shared: isSpecificTarget ? false : isShared,
        age_groups: isSpecificTarget ? [] : ageGroups,
        coach_type: isSpecificTarget ? null : (coachType || null),
        video_url: videoUrl.trim() || null,
        assigned_child_id: targetChildId,
        scheduled_days: isSpecificTarget ? scheduledDays : [],
        exercises: cleanExercises,
      });
      if (insertError) throw insertError;
      router.push(forChild ? "/parent/coaching" : "/parent/workouts");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <form onSubmit={handleSave} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
        <h1 className="font-display text-xl font-bold text-plum mb-1">Build a workout</h1>
        {forChild ? (
          <p className="text-sm text-plumsoft mb-3">
            Building for <span className="font-bold text-coral">{childName || "…"}</span> — this goes to them only, never shared elsewhere.
          </p>
        ) : selectedTarget !== "all" ? (
          <p className="text-sm text-plumsoft mb-3">
            This workout will go to just that one kid, not your whole family library.
          </p>
        ) : (
          <p className="text-sm text-plumsoft mb-3">Name it something fun — kids pick these from their adventure map.</p>
        )}

        {!forChild && (ownKids.length > 0 || coachedKids.length > 0) && (
          <>
            <label className="text-xs font-bold text-plumsoft uppercase">Who is this for?</label>
            <div className="flex gap-2 flex-wrap my-2 mb-4">
              {ownKids.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTarget("all")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
                    selectedTarget === "all" ? "bg-plum border-plum text-white" : "bg-cream border-cream text-plumsoft"
                  }`}
                >
                  All my kids
                </button>
              )}
              {ownKids.map((k) => (
                <button
                  type="button"
                  key={k.id}
                  onClick={() => setSelectedTarget(k.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
                    selectedTarget === k.id ? "bg-plum border-plum text-white" : "bg-cream border-cream text-plumsoft"
                  }`}
                >
                  {k.avatar_emoji} {k.name}
                </button>
              ))}
              {coachedKids.map((k) => (
                <button
                  type="button"
                  key={k.id}
                  onClick={() => setSelectedTarget(k.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
                    selectedTarget === k.id ? "bg-grass border-grass text-white" : "bg-cream border-cream text-plumsoft"
                  }`}
                >
                  🧑‍🏫 {k.name}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="text-xs font-bold text-plumsoft uppercase">Workout name</label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-3 mt-1 text-sm font-semibold"
          placeholder="The Pitcher"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label className="text-xs font-bold text-plumsoft uppercase">Subtitle (optional)</label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
          placeholder="A Baseball Workout"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        <label className="text-xs font-bold text-plumsoft uppercase">Sport tag</label>
        <div className="flex gap-2 flex-wrap my-2">
          {SPORT_TAGS.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => setSportTag(tag)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
                sportTag === tag ? "bg-coral border-coral text-white" : "bg-cream border-cream text-plumsoft"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-plumsoft uppercase">Difficulty</label>
        <div className="flex gap-2 my-2">
          {DIFFICULTIES.map((d) => (
            <button
              type="button"
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
                difficulty === d.key ? "bg-plum border-plum text-white" : "bg-cream border-cream text-plumsoft"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-plumsoft uppercase">Demo video link (optional)</label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
          placeholder="Paste a YouTube or video link — can add later"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />

        <label className="text-xs font-bold text-plumsoft uppercase mt-3 block mb-2">Exercises</label>
        <p className="text-[10px] text-plumsoft mb-2">Sets and rest are optional — great for real strength programming, but leave blank for a simple single-round exercise.</p>
        {exercises.map((ex, i) => (
          <div key={i} className="bg-cream rounded-lg p-2.5 mb-2">
            <div className="flex gap-2 mb-1.5">
              <input
                className="flex-1 border-2 border-white bg-white rounded-lg px-2.5 py-2 text-xs font-semibold"
                placeholder="Jumping jacks"
                value={ex.name}
                onChange={(e) => updateExercise(i, "name", e.target.value)}
              />
              <input
                className="w-20 border-2 border-white bg-white rounded-lg px-2.5 py-2 text-xs font-semibold"
                placeholder="30 sec"
                value={ex.detail}
                onChange={(e) => updateExercise(i, "detail", e.target.value)}
              />
              {exercises.length > 1 && (
                <button type="button" onClick={() => removeExercise(i)} className="text-coral text-lg px-1">
                  ×
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                className="w-24 border-2 border-white bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                placeholder="Sets (optional)"
                value={ex.sets ?? ""}
                onChange={(e) => updateExerciseNumber(i, "sets", e.target.value)}
              />
              <input
                type="number"
                min={0}
                className="w-28 border-2 border-white bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                placeholder="Rest sec (optional)"
                value={ex.rest_seconds ?? ""}
                onChange={(e) => updateExerciseNumber(i, "rest_seconds", e.target.value)}
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addExercise} className="block text-xs font-bold text-sky mb-5">
          + Add exercise
        </button>

        {(forChild || selectedTarget !== "all") && (
          <>
            <label className="text-xs font-bold text-plumsoft uppercase">Schedule it (optional)</label>
            <p className="text-[10px] text-plumsoft mb-2">Pick which days this shows up on their calendar — like programming a training week.</p>
            <div className="flex gap-1.5 flex-wrap mb-5">
              {DAYS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`text-xs font-bold w-11 h-9 rounded-lg border-2 ${
                    scheduledDays.includes(d) ? "bg-grass border-grass text-white" : "bg-cream border-cream text-plumsoft"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}

        {isAdmin && !forChild && selectedTarget === "all" && (
          <>
            <label className="text-xs font-bold text-plumsoft uppercase">Age groups (optional — blank means all ages)</label>
            <div className="flex gap-2 flex-wrap my-2">
              {AGE_GROUPS.map((ag) => (
                <button
                  type="button"
                  key={ag}
                  onClick={() => toggleAgeGroup(ag)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
                    ageGroups.includes(ag) ? "bg-grass border-grass text-white" : "bg-cream border-cream text-plumsoft"
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>

            <label className="text-xs font-bold text-plumsoft uppercase">Tag as a coach library (optional)</label>
            <div className="flex gap-2 my-2">
              {COACH_TYPES.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => {
                    setCoachType(c.key);
                    if (c.key) setIsShared(true);
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
                    coachType === c.key ? "bg-sky border-sky text-white" : "bg-cream border-cream text-plumsoft"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2.5 bg-cream rounded-xl px-3.5 py-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs font-bold text-plum">
                Share with other families
                <span className="block font-semibold text-plumsoft mt-0.5">
                  Any parent using the app can show this to their kids too — not just yours
                </span>
              </span>
            </label>
          </>
        )}

        {error && <p className="text-coral text-sm font-semibold mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-grass text-white font-display font-bold py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save workout"}
        </button>
      </form>
    </main>
  );
}
