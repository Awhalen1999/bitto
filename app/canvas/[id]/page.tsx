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
      {/* Canvas Area */}
      <main className="flex-1 bg-sky-900">
        {/* TODO: Integrate tldraw canvas here */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Canvas Editor
            </h2>
            <p className="text-zinc-400">Canvas ID: {canvasId}</p>
            <p className="text-zinc-500 text-sm mt-4">
              Konva.js integration coming next
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
