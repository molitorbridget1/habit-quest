"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Child = { id: string; name: string; age: number; avatar_emoji: string };

export default function ParentDashboard() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekCounts, setWeekCounts] = useState<Record<string, number>>({});
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState("");

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setRedeemStatus("Checking…");
    const { data, error } = await supabase.rpc("redeem_coach_code", { code: redeemCode.trim().toUpperCase() });
    if (error || !data) {
      setRedeemStatus("That code didn't match — double check with the parent who sent it.");
    } else {
      setRedeemStatus("You're linked! Build a workout and it'll show up for that child.");
      setRedeemCode("");
    }
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const { data: kids } = await supabase
        .from("children")
        .select("id, name, age, avatar_emoji")
        .eq("parent_id", userData.user.id)
        .order("created_at", { ascending: true });

      setChildren(kids || []);

      if (kids && kids.length > 0) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: logs } = await supabase
          .from("daily_logs")
          .select("child_id, water_cups, movement_done, veggie_done, sleep_done")
          .in("child_id", kids.map((k) => k.id))
          .gte("log_date", sevenDaysAgo.toISOString().slice(0, 10));

        const counts: Record<string, number> = {};
        (logs || []).forEach((l: any) => {
          const done = [l.movement_done, l.veggie_done, l.sleep_done, l.water_cups > 0].filter(Boolean).length;
          counts[l.child_id] = (counts[l.child_id] || 0) + done;
        });
        setWeekCounts(counts);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading…</main>;

  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-xl font-bold text-plum">Your family</h1>
        <button onClick={handleLogout} className="text-xs font-bold text-plumsoft">Log out</button>
      </div>

      {children.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center shadow mb-4">
          <p className="text-plumsoft text-sm mb-4">No kids added yet.</p>
          <Link href="/parent/add-child" className="bg-coral text-white font-display font-bold px-5 py-2.5 rounded-full">
            Add your first child
          </Link>
        </div>
      )}

      {children.map((c) => (
        <div key={c.id} className="bg-white rounded-2xl p-5 shadow mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-sun/30 flex items-center justify-center text-2xl border-2 border-white shadow">
              {c.avatar_emoji}
            </div>
            <div>
              <div className="font-display font-bold text-plum">{c.name}</div>
              <div className="text-xs text-plumsoft font-semibold">Age {c.age}</div>
            </div>
          </div>
          <div className="text-xs text-plumsoft font-semibold">
            {weekCounts[c.id] || 0} habits completed this week
          </div>
        </div>
      ))}

      {children.length > 0 && (
        <Link href="/parent/add-child" className="block text-center text-sm font-bold text-sky mb-3">
          + Add another child
        </Link>
      )}

      <div className="bg-white rounded-2xl p-4 shadow mb-3">
        <div className="font-display font-bold text-sm text-plum mb-1">Redeem Coach Code</div>
        <div className="text-xs text-plumsoft font-semibold mb-2">Got a code from a parent? Enter it to link your account as their coach.</div>
        <form onSubmit={handleRedeem} className="flex gap-2">
          <input
            className="flex-1 border-2 border-cream bg-cream rounded-xl px-3 py-2 text-sm font-bold tracking-widest uppercase"
            placeholder="ABC123"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
          />
          <button type="submit" className="bg-plum text-white font-display font-bold px-4 rounded-xl text-xs">
            Redeem
          </button>
        </form>
        {redeemStatus && <p className="text-xs font-semibold text-plumsoft mt-2">{redeemStatus}</p>}
      </div>

      <Link
        href="/parent/workouts"
        className="block text-center bg-white border-2 border-coral text-coral font-display font-bold py-3 rounded-xl mb-3"
      >
        🏋️ Manage workouts
      </Link>

      <Link
        href="/parent/games"
        className="block text-center bg-white border-2 border-sky text-sky font-display font-bold py-3 rounded-xl mb-3"
      >
        🎮 Manage daily games
      </Link>

      <Link
        href="/kid"
        className="block text-center bg-plum text-white font-display font-bold py-3 rounded-xl"
      >
        Switch to kid view →
      </Link>
    </main>
  );
}
