"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function KidPinPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("A parent needs to log in on this device first.");
        setLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from("children")
        .select("id, pin")
        .eq("id", childId)
        .single();
      if (fetchError || !data) throw new Error("Couldn't find that profile.");
      if (data.pin !== pin) {
        setError("That's not quite right — ask a grown-up for help.");
        setLoading(false);
        return;
      }
      sessionStorage.setItem(`kid-session-${childId}`, "true");
      router.push(`/kid/${childId}/dashboard`);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="font-display text-lg font-bold text-plum mb-5">Enter your PIN</h1>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          className="w-full text-center text-2xl tracking-[0.5em] border-2 border-cream bg-cream rounded-xl px-3 py-3 mb-4 font-bold"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        />
        {error && <p className="text-coral text-sm font-semibold mb-4">{error}</p>}
        {error.includes("log in") && (
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full bg-plum text-white font-display font-bold py-3 rounded-xl mb-3"
          >
            Log in as parent
          </button>
        )}
        <button
          type="submit"
          disabled={loading || pin.length !== 4}
          className="w-full bg-sky text-white font-display font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? "Checking…" : "Go!"}
        </button>
      </form>
    </main>
  );
}
