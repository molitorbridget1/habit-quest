"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Game = {
  id: string;
  category: string;
  game_type: "quiz" | "sort";
  age_tier: string | null;
  question: string;
  choices: { text: string; correct: boolean }[] | null;
  items: { label: string; emoji: string; match: boolean }[] | null;
  explanation: string | null;
};

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
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
    const { data: parentRow } = await supabase.from("parents").select("is_admin").eq("id", userData.user.id).single();
    if (!parentRow?.is_admin) {
      router.push("/parent");
      return;
    }
    const { data } = await supabase
      .from("daily_games")
      .select("id, category, game_type, age_tier, question, choices, items, explanation")
      .order("created_at", { ascending: false });
    setGames((data as any) || []);
    setLoading(false);
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading…</main>;

  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-xl font-bold text-plum">Daily Games</h1>
        <Link href="/parent" className="text-xs font-bold text-plumsoft">← Back</Link>
      </div>

      <p className="text-xs text-plumsoft mb-4">
        {games.length} game{games.length === 1 ? "" : "s"} in rotation. One shows per day per age tier — add ~30/month per tier to cover a full month without repeats.
      </p>

      <Link
        href="/parent/games/new"
        className="block text-center bg-coral text-white font-display font-bold py-3 rounded-xl mb-6"
      >
        + Add a game
      </Link>

      {games.map((g) => (
        <div key={g.id} className="bg-white rounded-2xl p-4 shadow mb-3">
          <div className="flex gap-2 mb-1.5">
            <span className="text-[9px] font-bold uppercase text-plumsoft">{g.category}</span>
            <span className="text-[9px] font-bold uppercase text-sky">{g.game_type === "sort" ? "Tap & Sort" : "Quiz"}</span>
            {g.age_tier && <span className="text-[9px] font-bold uppercase text-coral">{g.age_tier}</span>}
          </div>
          <div className="font-display font-bold text-sm text-plum mb-2">{g.question}</div>

          {g.game_type === "sort" && g.items && (
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((it, i) => (
                <span
                  key={i}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg ${it.match ? "bg-grass/15 text-plum" : "bg-cream text-plumsoft"}`}
                >
                  {it.emoji} {it.label}
                </span>
              ))}
            </div>
          )}

          {g.game_type === "quiz" && g.choices && (
            <div className="flex flex-col gap-1">
              {g.choices.map((c, i) => (
                <div key={i} className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${c.correct ? "bg-grass/15 text-plum" : "bg-cream text-plumsoft"}`}>
                  {c.correct ? "✓ " : ""}{c.text}
                </div>
              ))}
            </div>
          )}

          {g.explanation && <div className="text-[11px] text-plumsoft mt-2">{g.explanation}</div>}
        </div>
      ))}
    </main>
  );
}
