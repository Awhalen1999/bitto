"use client";

import { CanvasCard } from "./CanvasCard";
import { TrashCanvasCard } from "./TrashCanvasCard";
import type { Canvas } from "@/lib/api/canvases";

interface CanvasGridProps {
  canvases: Canvas[];
  isTrash?: boolean;
}

export function CanvasGrid({ canvases, isTrash = false }: CanvasGridProps) {
  if (canvases.length === 0) {
    return null;
  }

  const CardComponent = isTrash ? TrashCanvasCard : CanvasCard;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {canvases.map((canvas) => (
        <CardComponent key={canvas.id} canvas={canvas} />
      ))}
    </div>
  );
}
