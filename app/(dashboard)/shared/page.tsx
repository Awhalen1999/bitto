import { FileView } from "@/lib/components/dashboard/FileView";

export default function SharedPage() {
  return (
    <FileView
      view="shared"
      title="Shared with me"
      subtitle="Files others have shared with you"
      emptyMessage="No shared files yet."
    />
  );
}
