"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CanvasFileIcon } from "@/lib/components/shared/FileIcons";

interface CanvasHeaderProps {
  canvasId: string;
  canvasName?: string;
  lastEdited?: string;
}

export function CanvasHeader({
  canvasId,
  canvasName = "Untitled Canvas",
  lastEdited = "2h ago",
}: CanvasHeaderProps) {
  const router = useRouter();

  return (
    <header className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900 shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/")}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors "
          title="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </button>

        <div className="flex items-center gap-2">
          <CanvasFileIcon size="sm" />
          <h1 className="text-sm font-medium text-zinc-200">{canvasName}</h1>
          <span className="text-xs text-zinc-500">/</span>
          <span className="text-xs text-zinc-500">
            ID: {canvasId.substring(0, 12)}...
          </span>
          <span className="text-xs text-zinc-500">/</span>
          <span className="text-xs text-zinc-500">Edited {lastEdited}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* TODO: Share, collaborators */}
      </div>
    </header>
  );
}
