"use client";

import { CanvasCard } from "./CanvasCard";
import type { Canvas } from "@/lib/api/canvases";

interface CanvasGridProps {
  canvases: Canvas[];
}

export function CanvasGrid({ canvases }: CanvasGridProps) {
  if (canvases.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {canvases.map((canvas) => (
        <CanvasCard key={canvas.id} canvas={canvas} />
      ))}
    </div>
  );
}
