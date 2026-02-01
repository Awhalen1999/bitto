"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Workflow } from "lucide-react";
import { useDeleteCanvas } from "@/lib/hooks/useDeleteCanvas";
import type { Canvas } from "@/lib/api/canvases";

interface CanvasCardProps {
  canvas: Canvas;
}

export function CanvasCard({ canvas }: CanvasCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Proper React Query mutation hook
  const { mutate: deleteCanvas, isPending: isDeleting } = useDeleteCanvas();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(true);
  };

  const handleMenuClick = (action: string) => {
    setIsMenuOpen(false);

    if (action === "open") {
      router.push(`/canvas/${canvas.id}`);
    } else if (action === "trash") {
      handleDelete();
    }
  };

  const handleDelete = () => {
    deleteCanvas(canvas.id, {
      onSuccess: () => {
        console.log(`✅ Moved "${canvas.name}" to trash`);
      },
      onError: (error) => {
        alert(
          `Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="group relative" onContextMenu={handleContextMenu}>
      <Link href={`/canvas/${canvas.id}`}>
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-all cursor-pointer">
          {/* Thumbnail Area */}
          <div className="aspect-4/3 bg-zinc-800 flex items-center justify-center relative">
            {/* TODO: Active collaborators avatars */}
            <div className="absolute top-2 left-2 flex -space-x-2">
              {/* Avatar array will go here */}
            </div>

            {canvas.thumbnail_url ? (
              <img
                src={canvas.thumbnail_url}
                alt={canvas.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <p className="text-zinc-500 text-sm">No thumbnail available</p>
              </div>
            )}

            {/* Context Menu Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-md items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex hover:bg-zinc-800"
              disabled={isDeleting}
            >
              <MoreVertical className="w-4 h-4 text-zinc-300" />
            </button>
          </div>

          {/* Card Footer */}
          <div className="p-3 flex items-center gap-2.5">
            <div className="shrink-0 w-7 h-7 bg-blue-500/20 border border-blue-500/30 rounded flex items-center justify-center">
              <Workflow className="w-4 h-4 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white truncate leading-tight">
                {canvas.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Edited {formatDate(canvas.last_edited_at)}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Context Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-12 right-2 z-50 w-48 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 overflow-hidden"
        >
          <button
            onClick={() => handleMenuClick("open")}
            disabled={isDeleting}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Open
          </button>
          <button
            onClick={() => {
              window.open(`/canvas/${canvas.id}`, "_blank");
              setIsMenuOpen(false);
            }}
            disabled={isDeleting}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Open in new tab
          </button>
          <div className="border-t border-zinc-700"></div>
          <button
            onClick={() => handleMenuClick("trash")}
            disabled={isDeleting}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Moving to trash..." : "Move to trash"}
          </button>
        </div>
      )}
    </div>
  );
}
