"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Child = { id: string; name: string; avatar_emoji: string };

export default function KidPickerPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const { data: kids } = await supabase
        .from("children")
        .select("id, name, avatar_emoji")
        .eq("parent_id", userData.user.id);
      setChildren(kids || []);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
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
