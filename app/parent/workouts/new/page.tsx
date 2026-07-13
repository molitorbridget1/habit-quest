"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Exercise = { name: string; detail: string };

const SPORT_TAGS = ["General", "Baseball", "Soccer", "Basketball", "Football", "Gymnastics"];

export default function NewWorkoutPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [sportTag, setSportTag] = useState("General");
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", detail: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateExercise(i: number, field: "name" | "detail", value: string) {
    const next = [...exercises];
    next[i][field] = value;
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

      const { error: insertError } = await supabase.from("workouts").insert({
        parent_id: userData.user.id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        sport_tag: sportTag === "General" ? null : sportTag,
        exercises: cleanExercises,
      });
      if (insertError) throw insertError;
      router.push("/parent/workouts");
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
        <p className="text-sm text-plumsoft mb-5">Name it something fun — kids pick these from their adventure map.</p>

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

        <label className="text-xs font-bold text-plumsoft uppercase mt-3 block mb-2">Exercises</label>
        {exercises.map((ex, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              className="flex-1 border-2 border-cream bg-cream rounded-lg px-2.5 py-2 text-xs font-semibold"
              placeholder="Jumping jacks"
              value={ex.name}
              onChange={(e) => updateExercise(i, "name", e.target.value)}
            />
            <input
              className="w-24 border-2 border-cream bg-cream rounded-lg px-2.5 py-2 text-xs font-semibold"
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
        ))}
        <button type="button" onClick={addExercise} className="text-xs font-bold text-sky mb-5">
          + Add exercise
        </button>

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
