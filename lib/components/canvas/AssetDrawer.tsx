// lib/components/canvas/AssetDrawer.tsx
"use client";

import { useState } from "react";
import { ChevronRight, Upload, Search } from "lucide-react";

interface AssetDrawerProps {
  canvasId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function AssetDrawer({ canvasId, isOpen, onToggle }: AssetDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* Collapsed State - Thin bar on right edge */}
      {!isOpen && (
        <div className="absolute top-0 right-0 h-full w-12 bg-zinc-900 border-l border-zinc-800 flex items-center justify-center">
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors"
            title="Open asset drawer"
          >
            <ChevronRight className="w-4 h-4 text-zinc-400 rotate-180" />
          </button>
        </div>
      )}

      {/* Expanded State - Full drawer */}
      {isOpen && (
        <div className="absolute top-0 right-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl">
          {/* Header with toggle */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-white">Assets</h2>
            <button
              onClick={onToggle}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors"
              title="Close drawer"
            >
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Upload Button */}
          <div className="p-4 border-b border-zinc-800">
            <button className="w-full px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors text-sm flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Asset
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Empty State */}
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-400 text-sm mb-2">No assets yet</p>
              <p className="text-zinc-500 text-xs">
                Upload images, audio, or data files
              </p>
            </div>
          </div>

          {/* Footer - Storage indicator */}
          <div className="px-4 py-3 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>Storage</span>
              <span>0 / 50 assets</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: "0%" }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
