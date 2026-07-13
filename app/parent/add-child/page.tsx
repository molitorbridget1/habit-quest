"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AVATARS = ["🦊", "🐢", "🦁", "🐼", "🦉", "🐸"];
const SPORTS = ["Baseball", "Soccer", "Basketball", "Football", "Gymnastics", "Swimming"];
const STRENGTH_LEVELS = [
  { key: "beginner", label: "Just starting out" },
  { key: "intermediate", label: "Pretty active" },
  { key: "advanced", label: "Very athletic" },
];

export default function AddChildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState(8);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [pin, setPin] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [strengthLevel, setStrengthLevel] = useState("beginner");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSport(sport: string) {
    setSports((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not logged in.");
      if (!/^\d{4}$/.test(pin)) throw new Error("PIN must be exactly 4 digits.");

      const { error: insertError } = await supabase.from("children").insert({
        parent_id: userData.user.id,
        name,
        age,
        avatar_emoji: avatar,
        pin,
        sport_tags: sports,
        strength_level: strengthLevel,
      });
      if (insertError) throw insertError;
      router.push("/parent");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleAdd} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
        <h1 className="font-display text-xl font-bold text-plum mb-1">Add your child</h1>
        <p className="text-sm text-plumsoft mb-5">You're setting this up for them.</p>

        <label className="text-xs font-bold text-plumsoft uppercase">Child's name</label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="text-xs font-bold text-plumsoft uppercase">Age</label>
        <input
          type="number"
          min={5}
          max={14}
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          required
        />

        <label className="text-xs font-bold text-plumsoft uppercase">Pick an avatar</label>
        <div className="flex gap-2 my-2">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-xl border-2 ${
                avatar === a ? "border-coral bg-sun/30" : "border-cream bg-cream"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-plumsoft uppercase mt-3 block">Sports they play (optional)</label>
        <div className="flex gap-2 flex-wrap my-2">
          {SPORTS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => toggleSport(s)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
                sports.includes(s) ? "bg-sky border-sky text-white" : "bg-cream border-cream text-plumsoft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-plumsoft uppercase mt-3 block">Activity level</label>
        <p className="text-[11px] text-plumsoft mb-2">Helps us know what workouts to show them — not a judgment, just a starting point.</p>
        <div className="flex flex-col gap-2 mb-4">
          {STRENGTH_LEVELS.map((lvl) => (
            <button
              type="button"
              key={lvl.key}
              onClick={() => setStrengthLevel(lvl.key)}
              className={`text-left text-sm font-bold px-3 py-2.5 rounded-xl border-2 ${
                strengthLevel === lvl.key ? "bg-grass/20 border-grass text-plum" : "bg-cream border-cream text-plumsoft"
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-plumsoft uppercase mt-3 block">
          Set a 4-digit PIN for your child to log in
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-5 mt-1 text-sm font-semibold tracking-widest"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          required
        />

        {error && <p className="text-coral text-sm font-semibold mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-grass text-white font-display font-bold py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Adding…" : "Add child"}
        </button>
      </form>
    </main>
  );
}
