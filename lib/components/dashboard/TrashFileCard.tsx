"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { CanvasFileIcon } from "@/lib/components/shared/FileIcons";
import { useRestoreFile } from "@/lib/hooks/useRestoreFile";
import { usePermanentDeleteFile } from "@/lib/hooks/usePermanentDeleteFile";
import type { File } from "@/lib/api/files";

interface TrashFileCardProps {
  file: File;
}

export function TrashFileCard({ file }: TrashFileCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { mutate: restoreFile, isPending: isRestoring } = useRestoreFile();
  const { mutate: permanentDelete, isPending: isDeleting } =
    usePermanentDeleteFile();

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
    restoreFile(file.id, {
      onSuccess: () => {
        console.log(`✅ Restored "${file.name}"`);
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

    if (
      !confirm(`Permanently delete "${file.name}"? This cannot be undone.`)
    ) {
      return;
    }

    permanentDelete(file.id, {
      onSuccess: () => {
        console.log(`✅ Permanently deleted "${file.name}"`);
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
        className="relative bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 transition-all cursor-pointer"
      >
        <div className="aspect-4/3 bg-neutral-800 flex items-center justify-center relative opacity-60">
          <div className="w-full h-full bg-linear-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
            <p className="text-neutral-400 text-sm">Deleted file</p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-md items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex hover:bg-neutral-800"
            disabled={isPending}
          >
            <MoreVertical className="w-4 h-4 text-neutral-300" />
          </button>
        </div>

        <div className="p-3 flex items-center gap-2.5">
          <CanvasFileIcon />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate leading-tight">{file.name}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {formatDate(file.deleted_at!)}
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-12 right-2 z-50 w-48 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 overflow-hidden"
        >
          <button
            onClick={handleRestore}
            disabled={isPending}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            {isRestoring ? "Restoring..." : "Restore"}
          </button>
          <div className="border-t border-neutral-700" />
          <button
            onClick={handlePermanentDelete}
            disabled={isPending}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting permanently..." : "Permanently delete"}
          </button>
        </div>
      )}
    </div>
  );
}
