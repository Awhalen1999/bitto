"use client";

import { useMemo, useState } from "react";
import { FolderUp, PanelRightOpen, Search, X } from "lucide-react";
import { useCanvasAssets } from "@/lib/hooks/useCanvasAssets";

const STORAGE_LIMIT = 50;

interface LibraryProps {
  canvasId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function Library({ canvasId, isOpen, onToggle }: LibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: assets = [], isLoading } = useCanvasAssets(canvasId);

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.trim().toLowerCase();
    return assets.filter((a) => a.name.toLowerCase().includes(q));
  }, [assets, searchQuery]);

  return (
    <>
      {/* Closed: floating button at top-right (lines up with open drawer’s X) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl hover:bg-zinc-800 transition-colors"
          title="Open Library"
        >
          <PanelRightOpen className="w-4 h-4 text-zinc-400" />
        </button>
      )}

      {/* Open: full-bleed drawer, header has top/right padding so X lines up with closed button */}
      {isOpen && (
        <div className="absolute top-0 right-0 z-10 h-full w-80 flex flex-col border-l border-zinc-800 bg-zinc-900 shadow-xl">
          {/* Header – same inset as closed button (pt-3 pr-3) */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-3">
            <h2 className="text-sm font-semibold text-zinc-200">Library</h2>
            <button
              onClick={onToggle}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors"
              title="Close Library"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Search + Upload */}
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-500"
              />
            </div>
            <button
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors border border-zinc-700"
              title="Upload"
            >
              <FolderUp className="w-4 h-4" />
            </button>
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {isLoading ? (
              <p className="text-zinc-500 text-sm text-center py-8">Loading…</p>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                  <FolderUp className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-400 text-sm font-medium mb-2">
                  {assets.length === 0
                    ? "No items yet"
                    : "No items match your search"}
                </p>
                <p className="text-zinc-500 text-xs">
                  Upload images, audio, or data files
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredAssets.map((asset) => (
                  <li
                    key={asset.id}
                    className="px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-200 text-sm truncate"
                    title={asset.name}
                  >
                    {asset.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Storage</span>
              <span>
                {assets.length} / {STORAGE_LIMIT} items
              </span>
            </div>
            <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{
                  width: `${Math.min(100, (assets.length / STORAGE_LIMIT) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
