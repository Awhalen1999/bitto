"use client";

import { FileCard } from "./FileCard";
import { TrashFileCard } from "./TrashFileCard";
import type { File } from "@/lib/api/files";

interface FileGridProps {
  files: File[];
  isTrash?: boolean;
}

export function FileGrid({ files, isTrash = false }: FileGridProps) {
  if (files.length === 0) {
    return null;
  }

  const CardComponent = isTrash ? TrashFileCard : FileCard;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {files.map((file) => (
        <CardComponent key={file.id} file={file} />
      ))}
    </div>
  );
}
