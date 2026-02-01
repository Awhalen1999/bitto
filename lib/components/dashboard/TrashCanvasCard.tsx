"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Workflow } from "lucide-react";
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

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="group relative" onContextMenu={openMenu}>
      <div
        onClick={openMenu}
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

          {/* Menu Button - Top Right (same as CanvasCard) */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-md items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex hover:bg-zinc-800"
            disabled={isPending}
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
              {formatDate(canvas.deleted_at!)}
            </p>
          </div>
        </div>
      </div>

      {/* Menu - same styling as CanvasCard, anchored below ... button */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-12 right-2 z-50 w-48 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 overflow-hidden"
        >
          <button
            onClick={handleRestore}
            disabled={isPending}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isRestoring ? "Restoring..." : "Restore"}
          </button>
          <div className="border-t border-zinc-700"></div>
          <button
            onClick={handlePermanentDelete}
            disabled={isPending}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting permanently..." : "Permanently delete"}
          </button>
        </div>
      )}
    </div>
  );
}
