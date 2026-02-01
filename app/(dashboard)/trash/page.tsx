import { CanvasView } from "@/lib/components/dashboard/CanvasView";

export default function TrashPage() {
  return (
    <CanvasView
      view="trash"
      title="Trash"
      subtitle="Deleted canvases"
      emptyMessage="Trash is empty."
    />
  );
}
