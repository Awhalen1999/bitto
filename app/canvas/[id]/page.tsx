"use client";

import { useParams } from "next/navigation";
import { KonvaCanvas } from "@/lib/components/canvas/KonvaCanvas";

export default function CanvasEditorPage() {
  const params = useParams();
  const canvasId = params.id as string;

  return <KonvaCanvas canvasId={canvasId} />;
}
