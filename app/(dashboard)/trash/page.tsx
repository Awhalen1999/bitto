import { FileView } from "@/lib/components/dashboard/FileView";

export default function TrashPage() {
  return (
    <FileView
      view="trash"
      title="Trash"
      subtitle="Deleted files"
      emptyMessage="Trash is empty."
    />
  );
}
