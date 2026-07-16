"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Child = { id: string; name: string; avatar_emoji: string };

export default function KidPickerPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }
      const { data: kids } = await supabase
        .from("children")
        .select("id, name, avatar_emoji")
        .eq("parent_id", userData.user.id);
      setChildren(kids || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading…</main>;

  if (needsLogin) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="font-display text-lg font-bold text-plum mb-2">A parent needs to log in first</h1>
        <p className="text-sm text-plumsoft mb-6 max-w-xs">
          This device/app icon isn't linked to a parent account yet. Log in once and it'll stay signed in after that.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-coral text-white font-display font-bold px-6 py-3 rounded-full"
        >
          Log in as parent
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <button
        onClick={() => router.push("/parent")}
        className="absolute top-6 right-6 text-xs font-bold text-plumsoft"
      >
        Parent view →
      </button>
      <h1 className="font-display text-xl font-bold text-plum mb-8">Whose turn is it?</h1>
      <div className="flex gap-6 flex-wrap justify-center">
        {children.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/kid/${c.id}`)}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl">
              {c.avatar_emoji}
            </div>
            <span className="font-display font-bold text-plum text-sm">{c.name}</span>
          </button>
        ))}
      </div>
      {children.length === 0 && <p className="text-plumsoft text-sm">No kids set up yet.</p>}
    </main>
  );
}
