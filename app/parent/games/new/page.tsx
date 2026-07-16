"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Choice = { text: string; correct: boolean };
type Item = { label: string; emoji: string; match: boolean };

export default function NewGamePage() {
  const router = useRouter();
  const [gameType, setGameType] = useState<"quiz" | "sort">("sort");
  const [category, setCategory] = useState("nutrition");
  const [ageTier, setAgeTier] = useState<"" | "younger" | "older">("");
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<Choice[]>([
    { text: "", correct: true },
    { text: "", correct: false },
  ]);
  const [items, setItems] = useState<Item[]>([
    { label: "", emoji: "", match: true },
    { label: "", emoji: "", match: true },
    { label: "", emoji: "", match: false },
    { label: "", emoji: "", match: false },
  ]);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const { data: parentRow } = await supabase.from("parents").select("is_admin").eq("id", userData.user.id).single();
      if (!parentRow?.is_admin) {
        router.push("/parent");
        return;
      }
      setChecked(true);
    })();
  }, [router]);

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

  function updateItem(i: number, field: "label" | "emoji", value: string) {
    const next = [...items];
    next[i][field] = value;
    setItems(next);
  }
  function toggleItemMatch(i: number) {
    const next = [...items];
    next[i].match = !next[i].match;
    setItems(next);
  }
  function addItem() {
    if (items.length >= 8) return;
    setItems([...items, { label: "", emoji: "", match: false }]);
  }
  function removeItem(i: number) {
    if (items.length <= 4) return;
    setItems(items.filter((_, idx) => idx !== i));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not logged in.");
      if (!question.trim()) throw new Error(gameType === "sort" ? "Write a prompt, e.g. 'Tap all the PROTEIN foods'." : "Write a question.");

      let payload: any = {
        parent_id: userData.user.id,
        category,
        game_type: gameType,
        age_tier: ageTier || null,
        question: question.trim(),
        explanation: explanation.trim() || null,
      };

      if (gameType === "quiz") {
        const cleanChoices = choices.filter((c) => c.text.trim() !== "");
        if (cleanChoices.length < 2) throw new Error("Add at least 2 answer choices.");
        payload.choices = cleanChoices;
      } else {
        const cleanItems = items.filter((it) => it.label.trim() !== "");
        if (cleanItems.length < 3) throw new Error("Add at least 3 items to sort.");
        if (!cleanItems.some((it) => it.match) || !cleanItems.some((it) => !it.match)) {
          throw new Error("Include at least one matching item and one distractor.");
        }
        payload.items = cleanItems;
      }

      const { error: insertError } = await supabase.from("daily_games").insert(payload);
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
      {!checked ? (
        <p className="text-plumsoft">Checking access…</p>
      ) : (
      <form onSubmit={handleSave} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
        <h1 className="font-display text-xl font-bold text-plum mb-1">Add a daily game</h1>
        <p className="text-sm text-plumsoft mb-5">Rotates automatically — one shows per day per age tier.</p>

        <label className="text-xs font-bold text-plumsoft uppercase">Game type</label>
        <div className="flex gap-2 my-2">
          <button
            type="button"
            onClick={() => setGameType("sort")}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${gameType === "sort" ? "bg-coral border-coral text-white" : "bg-cream border-cream text-plumsoft"}`}
          >
            🎯 Tap & Sort
          </button>
          <button
            type="button"
            onClick={() => setGameType("quiz")}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${gameType === "quiz" ? "bg-coral border-coral text-white" : "bg-cream border-cream text-plumsoft"}`}
          >
            ❓ Multiple Choice
          </button>
        </div>

        <label className="text-xs font-bold text-plumsoft uppercase mt-2 block">Category</label>
        <div className="flex gap-2 my-2">
          {["nutrition", "fitness"].map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 capitalize ${category === c ? "bg-plum border-plum text-white" : "bg-cream border-cream text-plumsoft"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-plumsoft uppercase mt-2 block">Age tier</label>
        <div className="flex gap-2 my-2">
          {[
            { key: "", label: "Both" },
            { key: "younger", label: "Younger (5-10)" },
            { key: "older", label: "Older (11-18)" },
          ].map((t) => (
            <button
              type="button"
              key={t.key}
              onClick={() => setAgeTier(t.key as any)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${ageTier === t.key ? "bg-sky border-sky text-white" : "bg-cream border-cream text-plumsoft"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-plumsoft uppercase mt-3 block">
          {gameType === "sort" ? "Prompt" : "Question"}
        </label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
          placeholder={gameType === "sort" ? "Tap all the PROTEIN foods" : "Which food gives long-lasting energy?"}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />

        {gameType === "sort" ? (
          <>
            <label className="text-xs font-bold text-plumsoft uppercase mb-2 block">
              Items — check the box for ones that MATCH the prompt
            </label>
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleItemMatch(i)}
                  className={`w-6 h-6 min-w-[1.5rem] rounded-md border-2 flex items-center justify-center text-xs ${
                    it.match ? "bg-grass border-grass text-white" : "border-cream"
                  }`}
                >
                  {it.match ? "✓" : ""}
                </button>
                <input
                  className="w-14 border-2 border-cream bg-cream rounded-lg px-2 py-2 text-sm text-center"
                  placeholder="🍗"
                  value={it.emoji}
                  onChange={(e) => updateItem(i, "emoji", e.target.value)}
                />
                <input
                  className="flex-1 border-2 border-cream bg-cream rounded-lg px-2.5 py-2 text-xs font-semibold"
                  placeholder="Chicken"
                  value={it.label}
                  onChange={(e) => updateItem(i, "label", e.target.value)}
                />
                {items.length > 4 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-coral text-lg px-1">×</button>
                )}
              </div>
            ))}
            {items.length < 8 && (
              <button type="button" onClick={addItem} className="block text-xs font-bold text-sky mb-4">
                + Add item
              </button>
            )}
          </>
        ) : (
          <>
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
              <button type="button" onClick={addChoice} className="block text-xs font-bold text-sky mb-4">
                + Add another choice
              </button>
            )}
          </>
        )}

        <label className="text-xs font-bold text-plumsoft uppercase mt-2 block">Explanation (shown after they answer)</label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-5 mt-1 text-sm font-semibold"
          placeholder="Protein helps repair and build muscle..."
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
      )}
    </main>
  );
}
