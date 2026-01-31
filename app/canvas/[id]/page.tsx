"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect } from "react";

export default function CanvasEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const canvasId = params.id as string;

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
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Top Bar */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </button>
          <h1 className="text-sm font-medium text-white">
            Canvas {canvasId.substring(0, 8)}...
          </h1>
        </div>

        {/* TODO: Share button, collaborator avatars */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-500">Editor coming soon...</div>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="flex-1 bg-zinc-900">
        {/* TODO: Integrate tldraw canvas here */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Canvas Editor
            </h2>
            <p className="text-zinc-400">Canvas ID: {canvasId}</p>
            <p className="text-zinc-500 text-sm mt-4">
              tldraw integration coming next
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
