"use client";

import { useState, useRef, useEffect } from "react";
import { FileText } from "lucide-react";
import { useRestoreCanvas } from "@/lib/hooks/useRestoreCanvas";
import { usePermanentDeleteCanvas } from "@/lib/hooks/usePermanentDeleteCanvas";
import type { Canvas } from "@/lib/api/canvases";

interface TrashCanvasCardProps {
  canvas: Canvas;
}

export function TrashCanvasCard({ canvas }: TrashCanvasCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { mutate: restoreCanvas, isPending: isRestoring } = useRestoreCanvas();
  const { mutate: permanentDelete, isPending: isDeleting } =
    usePermanentDeleteCanvas();

  const isPending = isRestoring || isDeleting;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open menu on click (not navigate)
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(true);
  };

  const handleRestore = () => {
    setIsMenuOpen(false);
    restoreCanvas(canvas.id, {
      onSuccess: () => {
        console.log(`✅ Restored "${canvas.name}"`);
      },
      onError: (error) => {
        alert(
          `Failed to restore: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      },
    });
  };

  const handlePermanentDelete = () => {
    setIsMenuOpen(false);
    permanentDelete(canvas.id, {
      onSuccess: () => {
        console.log(`✅ Permanently deleted "${canvas.name}"`);
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
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "Trashed today";
    if (diffInDays === 1) return "Trashed yesterday";
    return `Trashed ${diffInDays}d ago`;
  };

  return (
    <div className="group relative">
      <div
        onClick={handleClick}
        className="relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-all cursor-pointer"
      >
        {/* Thumbnail Area - Dimmed for trash */}
        <div className="aspect-4/3 bg-zinc-800 flex items-center justify-center relative opacity-60">
          {canvas.thumbnail_url ? (
            <img
              src={canvas.thumbnail_url}
              alt={canvas.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <p className="text-zinc-400 text-sm">No thumbnail available</p>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="p-3 flex items-center gap-2.5">
          <div className="shrink-0 w-7 h-7 bg-purple-500/20 border border-purple-500/30 rounded flex items-center justify-center">
            <FileText className="w-4 h-4 text-purple-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate leading-tight">
              {canvas.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {formatDate(canvas.deleted_at!)}
            </p>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-56 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 overflow-hidden"
        >
          <button
            onClick={handleRestore}
            disabled={isPending}
            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isRestoring ? "Restoring..." : "Restore"}
          </button>
          <div className="border-t border-zinc-700"></div>
          <button
            onClick={handlePermanentDelete}
            disabled={isPending}
            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting permanently..." : "Permanently delete"}
          </button>
        </div>
      )}
    </div>
  );
}
