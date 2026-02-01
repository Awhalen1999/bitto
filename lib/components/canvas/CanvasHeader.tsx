"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CanvasFileIcon } from "@/lib/components/shared/FileIcons";
import { useCanvas } from "@/lib/hooks/useCanvas";

interface CanvasHeaderProps {
  canvasId: string;
}

export function CanvasHeader({ canvasId }: CanvasHeaderProps) {
  const router = useRouter();
  const { data: canvas, isLoading } = useCanvas(canvasId);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "yesterday";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <header className="h-10 border-b border-neutral-800 flex items-center justify-between px-4 bg-black shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/")}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-neutral-200"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <CanvasFileIcon size="sm" />
          <h1 className="text-sm font-medium text-neutral-200">
            {isLoading ? "Loading..." : canvas?.name || "Untitled Canvas"}
          </h1>
          <span className="text-xs text-neutral-500">/</span>
          <span className="text-xs text-neutral-500">
            {canvasId.substring(0, 12)}...
          </span>
          {canvas?.updated_at && (
            <>
              <span className="text-xs text-neutral-500">/</span>
              <span className="text-xs text-neutral-500">
                Edited {formatRelativeTime(canvas.updated_at)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* TODO: Share, collaborators */}
      </div>
    </header>
  );
}
