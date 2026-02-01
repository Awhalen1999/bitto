"use client";

import { useState } from "react";
import {
  FolderUp,
  PanelRightClose,
  PanelRightOpen,
  Search,
} from "lucide-react";

interface AssetDrawerProps {
  canvasId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function AssetDrawer({ isOpen, onToggle }: AssetDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* Closed: whole bar is one button (Figma-style) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute top-2 right-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl hover:bg-zinc-800 transition-colors text-left"
          title="Open Assets"
        >
          <PanelRightOpen className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-white">Assets</span>
        </button>
      )}

      {/* Open: full drawer with close button on left of header (Figma-style) */}
      {isOpen && (
        <div className="absolute top-0 right-0 h-full w-80 flex flex-col border-l border-zinc-800 bg-zinc-900 shadow-xl">
          <div className="flex items-center gap-2 p-3 border-b border-zinc-800">
            <button
              onClick={onToggle}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors shrink-0"
              title="Minimize Assets"
            >
              <PanelRightClose className="w-4 h-4 text-zinc-400" />
            </button>
            <h2 className="text-sm font-semibold text-zinc-200">Assets</h2>
          </div>

          {/* Search + Upload on one line */}
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-500"
              />
            </div>
            <button
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-zinc-200 text-zinc-900 hover:bg-zinc-300 transition-colors"
              title="Upload Asset"
            >
              <FolderUp className="w-4 h-4" />
            </button>
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Empty State */}
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <FolderUp className="w-8 h-8 text-zinc-600" />
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
