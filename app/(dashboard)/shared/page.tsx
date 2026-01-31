import { CanvasView } from "@/lib/components/dashboard/CanvasView";

export default function SharedPage() {
  return (
    <CanvasView
      view="shared"
      title="Shared with me"
      subtitle="Canvases others have shared with you"
      emptyMessage="No shared canvases yet."
    />
  );
}
