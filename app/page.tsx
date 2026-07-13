import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">🎮</div>
      <h1 className="font-display text-3xl font-extrabold text-plum mb-3">Habit Quest</h1>
      <p className="text-plumsoft max-w-sm mb-8">
        A game-first habit app that teaches kids why healthy habits matter — no dieting, no shame, no BMI.
      </p>
      <div className="flex gap-3">
        <Link href="/signup" className="bg-coral text-white font-display font-bold px-6 py-3 rounded-full shadow-lg">
          Get Started
        </Link>
        <Link href="/login" className="bg-white text-plum font-display font-bold px-6 py-3 rounded-full border-2 border-plum/10">
          Log In
        </Link>
      </div>
    </main>
  );
}
