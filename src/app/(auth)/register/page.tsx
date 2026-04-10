"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  Flame,
  BarChart2,
  Loader2,
  Mail,
  Lock,
  User,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-powered card generation",
    desc: "Upload any PDF and watch Gemini AI extract key concepts into study-ready flashcards.",
  },
  {
    icon: Flame,
    title: "SM-2 spaced repetition",
    desc: "Science-backed scheduling surfaces cards right before you'd forget them.",
  },
  {
    icon: BarChart2,
    title: "Smart analytics",
    desc: "Track retention, streaks, and mastery across every deck you own.",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      router.push("/login?registered=1");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* ── Left Hero Panel ── */}
      <div className="relative flex-[3] flex flex-col justify-center overflow-hidden bg-[hsl(var(--primary))] px-8 py-14 sm:px-14 lg:px-20">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-white/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[360px] w-[360px] rounded-full bg-indigo-400/20 blur-[100px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-48 w-48 -translate-y-1/2 rounded-full bg-purple-400/15 blur-[80px]" />

        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              CardMind
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Turn any PDF into
            <br />
            <span className="text-white/80">smart flashcards</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            Upload your study material and let AI do the heavy lifting. Review
            with spaced repetition that adapts to your memory.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <f.icon className="h-5 w-5 text-white/90" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-white/60">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>

      {/* ── Right Register Panel ── */}
      <div className="flex flex-[2] items-center justify-center bg-background px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand">
              <Brain className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">CardMind</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start learning smarter in under a minute
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="Ada Lovelace"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[hsl(var(--primary))] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
