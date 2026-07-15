"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Game = {
  id: string;
  category: string;
  question: string;
  choices: { text: string; correct: boolean }[];
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
    const { data } = await supabase
      .from("daily_games")
      .select("id, category, question, choices, explanation")
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
        These rotate automatically — one shows per day, the same one for every kid, based on the date. Add more anytime and they'll join the rotation.
      </p>

      <Link
        href="/parent/games/new"
        className="block text-center bg-coral text-white font-display font-bold py-3 rounded-xl mb-6"
      >
        + Add a game
      </Link>

      {games.map((g) => (
        <div key={g.id} className="bg-white rounded-2xl p-4 shadow mb-3">
          <span className="text-[9px] font-bold uppercase text-plumsoft">{g.category}</span>
          <div className="font-display font-bold text-sm text-plum mt-0.5 mb-2">{g.question}</div>
          <div className="flex flex-col gap-1">
            {g.choices.map((c, i) => (
              <div key={i} className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${c.correct ? "bg-grass/15 text-plum" : "bg-cream text-plumsoft"}`}>
                {c.correct ? "✓ " : ""}{c.text}
              </div>
            ))}
          </div>
          {g.explanation && <div className="text-[11px] text-plumsoft mt-2">{g.explanation}</div>}
        </div>
      ))}
    </main>
  );
}
