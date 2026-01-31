import { CanvasView } from "@/lib/components/dashboard/CanvasView";

export default function TrashPage() {
  return (
    <CanvasView
      view="trash"
      title="Trash"
      subtitle="Deleted canvases (kept for 30 days)"
      emptyMessage="Trash is empty."
    />
  );
}
