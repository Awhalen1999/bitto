"use client";

import { useSearchParams } from "next/navigation";
import { useFiles } from "@/lib/hooks/useFiles";
import { SortOption } from "@/lib/components/dashboard/DashboardHeader";
import { ViewType } from "@/lib/api/files";
import { FileGrid } from "./FileGrid";
import { FileText } from "lucide-react";

interface FileViewProps {
  view: ViewType;
  title: string;
  subtitle: string;
  emptyMessage?: string;
}

export function FileView({
  view,
  title,
  subtitle,
  emptyMessage,
}: FileViewProps) {
  const searchParams = useSearchParams();
  const sortBy = (searchParams.get("sort") as SortOption) || "last-modified";

  const { data: files, isLoading, error } = useFiles(view, sortBy);

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-neutral-400 mb-6">{subtitle}</p>
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-neutral-400 mb-6">{subtitle}</p>
        <div className="text-red-400">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-neutral-400 mb-6">{subtitle}</p>

      {!files || files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-neutral-600" />
          </div>
          <p className="text-neutral-400 text-lg mb-2">{emptyMessage || "No files yet"}</p>
          <p className="text-neutral-500 text-sm">Create your first file to get started</p>
        </div>
      ) : (
        <FileGrid files={files} isTrash={view === "trash"} />
      )}
    </div>
  );
}
