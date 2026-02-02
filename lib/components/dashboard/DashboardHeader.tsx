"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Dropdown } from "@/lib/components/shared/Dropdown";

export type SortOption = "last-modified" | "name-asc" | "name-desc" | "newest";

const sortOptions = [
  { value: "last-modified" as SortOption, label: "Last modified" },
  { value: "name-asc" as SortOption, label: "Name (A-Z)" },
  { value: "name-desc" as SortOption, label: "Name (Z-A)" },
  { value: "newest" as SortOption, label: "Newest first" },
];

interface DashboardHeaderProps {
  onCreateFile: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function DashboardHeader({
  onCreateFile,
  sortBy,
  onSortChange,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-black">
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-600 placeholder:text-neutral-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <Dropdown options={sortOptions} value={sortBy} onChange={onSortChange} label="Sort" />
        <button
          onClick={onCreateFile}
          className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New File
        </button>
      </div>
    </header>
  );
}
