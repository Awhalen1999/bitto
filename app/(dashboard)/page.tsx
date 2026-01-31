"use client";

import { useSearchParams } from "next/navigation";
import { useCanvases } from "@/lib/hooks/useCanvases";
import { SortOption } from "@/lib/components/dashboard/DashboardHeader";
import { ViewType } from "@/lib/api/canvases";

const viewTitles = {
  all: { title: "All files", subtitle: "All canvases you have access to" },
  "my-files": { title: "My files", subtitle: "Canvases you created" },
  shared: {
    title: "Shared with me",
    subtitle: "Canvases others have shared with you",
  },
  trash: { title: "Trash", subtitle: "Deleted canvases (kept for 30 days)" },
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as ViewType) || "all";
  const sortBy = (searchParams.get("sort") as SortOption) || "last-modified";

  const { data: canvases, isLoading, error } = useCanvases(view, sortBy);
  const { title, subtitle } = viewTitles[view] || viewTitles.all;

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-zinc-400 mb-6">{subtitle}</p>
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-zinc-400 mb-6">{subtitle}</p>
        <div className="text-red-400">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-zinc-400 mb-6">{subtitle}</p>

      {!canvases || canvases.length === 0 ? (
        <div className="text-zinc-400">
          {view === "trash"
            ? "Trash is empty."
            : view === "shared"
              ? "No shared canvases yet."
              : "No canvases yet. Create one to get started!"}
        </div>
      ) : (
        <div className="text-zinc-400">Found {canvases.length} canvas(es)</div>
      )}
    </div>
  );
}
