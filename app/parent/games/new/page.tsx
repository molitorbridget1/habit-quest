"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Choice = { text: string; correct: boolean };

export default function NewGamePage() {
  const router = useRouter();
  const [category, setCategory] = useState("nutrition");
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<Choice[]>([
    { text: "", correct: true },
    { text: "", correct: false },
  ]);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateChoiceText(i: number, text: string) {
    const next = [...choices];
    next[i].text = text;
    setChoices(next);
  }

  function setCorrect(i: number) {
    setChoices(choices.map((c, idx) => ({ ...c, correct: idx === i })));
  }

  function addChoice() {
    if (choices.length >= 4) return;
    setChoices([...choices, { text: "", correct: false }]);
  }

  function removeChoice(i: number) {
    if (choices.length <= 2) return;
    const next = choices.filter((_, idx) => idx !== i);
    if (!next.some((c) => c.correct)) next[0].correct = true;
    setChoices(next);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not logged in.");
      const cleanChoices = choices.filter((c) => c.text.trim() !== "");
      if (cleanChoices.length < 2) throw new Error("Add at least 2 answer choices.");
      if (!question.trim()) throw new Error("Write a question.");

      const { error: insertError } = await supabase.from("daily_games").insert({
        parent_id: userData.user.id,
        category,
        question: question.trim(),
        choices: cleanChoices,
        explanation: explanation.trim() || null,
      });
      if (insertError) throw insertError;
      router.push("/parent/games");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <form onSubmit={handleSave} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
        <h1 className="font-display text-xl font-bold text-plum mb-1">Add a brain game</h1>
        <p className="text-sm text-plumsoft mb-5">A quick multiple-choice question about nutrition or fitness.</p>

        <label className="text-xs font-bold text-plumsoft uppercase">Category</label>
        <div className="flex gap-2 my-2">
          {["nutrition", "fitness"].map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 capitalize ${
                category === c ? "bg-coral border-coral text-white" : "bg-cream border-cream text-plumsoft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-plumsoft uppercase mt-3 block">Question</label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
          placeholder="Which food gives long-lasting energy?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />

        <label className="text-xs font-bold text-plumsoft uppercase mb-2 block">
          Answer choices — tap the circle to mark the correct one
        </label>
        {choices.map((c, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setCorrect(i)}
              className={`w-6 h-6 min-w-[1.5rem] rounded-full border-2 flex items-center justify-center ${
                c.correct ? "bg-grass border-grass text-white" : "border-cream"
              }`}
            >
              {c.correct ? "✓" : ""}
            </button>
            <input
              className="flex-1 border-2 border-cream bg-cream rounded-lg px-2.5 py-2 text-xs font-semibold"
              placeholder={`Choice ${i + 1}`}
              value={c.text}
              onChange={(e) => updateChoiceText(i, e.target.value)}
            />
            {choices.length > 2 && (
              <button type="button" onClick={() => removeChoice(i)} className="text-coral text-lg px-1">×</button>
            )}
          </div>
        ))}
        {choices.length < 4 && (
          <button type="button" onClick={addChoice} className="text-xs font-bold text-sky mb-4">
            + Add another choice
          </button>
        )}

        <label className="text-xs font-bold text-plumsoft uppercase mt-2 block">Explanation (shown after they answer)</label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-5 mt-1 text-sm font-semibold"
          placeholder="Whole grains release energy slowly..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />

        {error && <p className="text-coral text-sm font-semibold mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-grass text-white font-display font-bold py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save game"}
        </button>
      </form>
    </main>
  );
}
