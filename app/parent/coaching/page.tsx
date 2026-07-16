"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type CoachedChild = {
  id: string;
  name: string;
  avatar_emoji: string;
  age: number;
  sport_tags: string[];
  difficulty_filter: string | null;
};

export default function CoachingPage() {
  const router = useRouter();
  const [kids, setKids] = useState<CoachedChild[]>([]);
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
    const { data } = await supabase.rpc("get_coached_children");
    setKids((data as any) || []);
    setLoading(false);
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading…</main>;

  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-display text-xl font-bold text-plum">Coaching</h1>
        <Link href="/parent" className="text-xs font-bold text-plumsoft">← My kids</Link>
      </div>
      <p className="text-xs text-plumsoft mb-6">
        Kids who've added you as their coach. Workouts you build here go to that kid only — never shared with other families.
      </p>

      {kids.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center shadow">
          <p className="text-plumsoft text-sm">No one's added you as a coach yet. Ask a parent for their invite code, then redeem it from your main dashboard.</p>
        </div>
      )}

      {kids.map((k) => (
        <div key={k.id} className="bg-white rounded-2xl p-4 shadow mb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-full bg-sun/30 flex items-center justify-center text-xl border-2 border-white shadow">
              {k.avatar_emoji}
            </div>
            <div>
              <div className="font-display font-bold text-plum">{k.name}</div>
              <div className="text-[11px] text-plumsoft font-semibold">
                Age {k.age}{k.sport_tags?.length > 0 ? ` · ${k.sport_tags.join(", ")}` : ""}
              </div>
            </div>
          </div>
          <Link
            href={`/parent/workouts/new?forChild=${k.id}`}
            className="block text-center bg-coral text-white font-display font-bold py-2.5 rounded-xl text-sm"
          >
            + Build a workout for {k.name}
          </Link>
        </div>
      ))}
    </main>
  );
}
