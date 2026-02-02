"use client";

import { useParams } from "next/navigation";
import { KonvaCanvas } from "@/lib/components/canvas/KonvaCanvas";

export default function CanvasEditorPage() {
  const params = useParams();
  const fileId = params.id as string;

  return (
    <div className="h-full w-full min-h-0 min-w-0 relative">
      <KonvaCanvas fileId={fileId} />
    </div>
  );
}
