"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getFirebaseErrorMessage } from "@/lib/utils/errors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim() || !password) {
      setError("Please fill out all fields");
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/");
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-[360px] p-6 bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Welcome back</h1>
        <p className="text-neutral-400 text-sm mt-1 mb-6">Sign in to your account</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-11 bg-white text-neutral-900 rounded-lg font-medium hover:bg-neutral-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 mb-5"
        >
          <Image src="/google.svg" alt="" width={20} height={20} className="shrink-0" />
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-neutral-500 text-xs uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm text-neutral-400 mb-1.5">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full h-10 px-3 bg-black/50 border border-neutral-700 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500 disabled:opacity-50"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm text-neutral-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full h-10 px-3 pr-16 bg-black/50 border border-neutral-700 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500 disabled:opacity-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-white hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
