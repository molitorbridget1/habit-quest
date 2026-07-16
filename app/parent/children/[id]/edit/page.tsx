"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SPORTS = ["Baseball", "Soccer", "Basketball", "Football", "Gymnastics", "Swimming", "Golf", "Wrestling", "Volleyball", "Cheerleading", "Dance", "Track & Field", "Cross Country"];
const STRENGTH_LEVELS = [
  { key: "beginner", label: "Just starting out" },
  { key: "intermediate", label: "Pretty active" },
  { key: "advanced", label: "Very athletic" },
];
const COACHING_MODES = [
  { key: "parent_lead", label: "Parent Lead", sub: "I'll build their workouts myself" },
  { key: "coach_bee", label: "Coach Bee", sub: "Cardio & fun base workouts" },
  { key: "coach_erick", label: "Coach Erick", sub: "Sports-based agility, strength & speed" },
  { key: "invite_coach", label: "Invite a coach", sub: "Their real coach builds workouts in the app" },
];

export default function EditChildPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [strengthLevel, setStrengthLevel] = useState("beginner");
  const [coachingMode, setCoachingMode] = useState("parent_lead");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }
    const { data } = await supabase
      .from("children")
      .select("name, birthdate, sport_tags, strength_level, coaching_mode, invite_code")
      .eq("id", childId)
      .single();
    if (data) {
      setName(data.name);
      setBirthdate(data.birthdate || "");
      setSports(data.sport_tags || []);
      setStrengthLevel(data.strength_level || "beginner");
      setCoachingMode(data.coaching_mode || "parent_lead");
      setInviteCode(data.invite_code);
    }
    setLoading(false);
  }

  function toggleSport(sport: string) {
    setSports((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));
  }

  function generateCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      let codeToSave = inviteCode;
      if (coachingMode === "invite_coach" && !codeToSave) {
        codeToSave = generateCode();
      }

      const { error: updateError } = await supabase
        .from("children")
        .update({
          birthdate: birthdate || null,
          sport_tags: sports,
          strength_level: strengthLevel,
          coaching_mode: coachingMode,
          invite_code: coachingMode === "invite_coach" ? codeToSave : inviteCode,
        })
        .eq("id", childId);
      if (updateError) throw updateError;

      setInviteCode(codeToSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-plumsoft">Loading…</main>;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <form onSubmit={handleSave} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
        <h1 className="font-display text-xl font-bold text-plum mb-1">Edit {name}</h1>
        <p className="text-sm text-plumsoft mb-5">Update anytime as they grow or change sports.</p>

        <label className="text-xs font-bold text-plumsoft uppercase">Birthday</label>
        <p className="text-[11px] text-plumsoft mb-1.5">We use this to automatically age them up — no need to update age manually.</p>
        <input
          type="date"
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />

        <label className="text-xs font-bold text-plumsoft uppercase mt-2 block">Sports they play</label>
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

        <label className="text-xs font-bold text-plumsoft uppercase mt-3 block">Who manages their workouts?</label>
        <div className="flex flex-col gap-2 mb-2">
          {COACHING_MODES.map((m) => (
            <button
              type="button"
              key={m.key}
              onClick={() => setCoachingMode(m.key)}
              className={`text-left px-3 py-2.5 rounded-xl border-2 ${
                coachingMode === m.key ? "bg-coral/10 border-coral" : "bg-cream border-cream"
              }`}
            >
              <div className="text-sm font-bold text-plum">{m.label}</div>
              <div className="text-[11px] text-plumsoft font-semibold">{m.sub}</div>
            </button>
          ))}
        </div>

        {coachingMode === "invite_coach" && inviteCode && (
          <div className="bg-cream rounded-xl p-3 text-center mb-4">
            <div className="text-[10px] font-bold text-plumsoft uppercase mb-1">Coach invite code</div>
            <div className="font-display text-xl font-extrabold tracking-widest text-coral">{inviteCode}</div>
          </div>
        )}

        {error && <p className="text-coral text-sm font-semibold mb-4">{error}</p>}
        {saved && <p className="text-grass text-sm font-semibold mb-4">Saved ✓</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-coral text-white font-display font-bold py-3 rounded-xl disabled:opacity-60 mb-2"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/parent")}
          className="w-full text-plumsoft font-bold text-sm py-2"
        >
          Back
        </button>
      </form>
    </main>
  );
}
