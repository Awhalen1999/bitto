"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const KonvaCanvas = dynamic(
  () =>
    import("@/lib/components/canvas/KonvaCanvas").then((mod) => ({
      default: mod.KonvaCanvas,
    })),
  { ssr: false }
);

export default function CanvasEditorPage() {
  const params = useParams();
  const fileId = params.id as string;

  return (
    <div className="h-full w-full min-h-0 min-w-0 relative">
      <KonvaCanvas fileId={fileId} />
    </div>
  );
}
