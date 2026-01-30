"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="mb-2">Logged in as: {user.email}</p>
      <p className="mb-4">UID: {user.uid}</p>
      <button
        onClick={signOut}
        className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
      >
        Sign Out
      </button>
    </div>
  );
}
