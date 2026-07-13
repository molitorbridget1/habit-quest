"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      router.push("/parent");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
        <h1 className="font-display text-xl font-bold text-plum mb-5">Welcome back</h1>

        <label className="text-xs font-bold text-plumsoft uppercase">Email</label>
        <input
          type="email"
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="text-xs font-bold text-plumsoft uppercase">Password</label>
        <input
          type="password"
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-5 mt-1 text-sm font-semibold"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-coral text-sm font-semibold mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-coral text-white font-display font-bold py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="text-xs text-plumsoft text-center mt-4">
          No account yet? <a href="/signup" className="font-bold text-sky">Sign up</a>
        </p>
      </form>
    </main>
  );
}
