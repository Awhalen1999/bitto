"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { CanvasFileIcon } from "@/lib/components/shared/FileIcons";
import { useDeleteFile } from "@/lib/hooks/useDeleteFile";
import type { File } from "@/lib/api/files";

interface FileCardProps {
  file: File;
}

export function FileCard({ file }: FileCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();

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
      router.push(`/canvas/${file.id}`);
    } else if (action === "trash") {
      handleDelete();
    }
  };

  const handleDelete = () => {
    deleteFile(file.id, {
      onSuccess: () => {
        console.log(`✅ Moved "${file.name}" to trash`);
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
      <Link href={`/canvas/${file.id}`}>
        <div className="relative bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 transition-all cursor-pointer">
          <div className="aspect-4/3 bg-neutral-800 flex items-center justify-center relative">
            <div className="absolute top-2 left-2 flex -space-x-2" />
            <div className="w-full h-full bg-linear-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
              <p className="text-neutral-500 text-sm">File preview</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-md items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex hover:bg-neutral-800"
              disabled={isDeleting}
            >
              <MoreVertical className="w-4 h-4 text-neutral-300" />
            </button>
          </div>

          <div className="p-3 flex items-center gap-3">
            <CanvasFileIcon />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white truncate leading-tight">{file.name}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Edited {formatDate(file.updated_at)}</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Context Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-12 right-2 z-50 w-48 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 overflow-hidden"
        >
          <button
            onClick={() => handleMenuClick("open")}
            disabled={isDeleting}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            Open
          </button>
          <button
            onClick={() => {
              window.open(`/canvas/${file.id}`, "_blank");
              setIsMenuOpen(false);
            }}
            disabled={isDeleting}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            Open in new tab
          </button>
          <div className="border-t border-neutral-700" />
          <button
            onClick={() => handleMenuClick("trash")}
            disabled={isDeleting}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Moving to trash..." : "Move to trash"}
          </button>
        </div>
      )}
    </div>
  );
}
