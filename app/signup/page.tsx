"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (signupError) throw signupError;
      if (data.session) {
        router.push("/parent/add-child");
      } else {
        setError("Check your email to confirm your account, then log in.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSignup} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
        <h1 className="font-display text-xl font-bold text-plum mb-1">Create your parent account</h1>
        <p className="text-sm text-plumsoft mb-5">Takes about a minute.</p>

        <label className="text-xs font-bold text-plumsoft uppercase">Your name</label>
        <input
          className="w-full border-2 border-cream bg-cream rounded-xl px-3 py-2 mb-4 mt-1 text-sm font-semibold"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          minLength={6}
          required
        />

        {error && <p className="text-coral text-sm font-semibold mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-coral text-white font-display font-bold py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-xs text-plumsoft text-center mt-4">
          Already have an account? <a href="/login" className="font-bold text-sky">Log in</a>
        </p>
      </form>
    </main>
  );
}
