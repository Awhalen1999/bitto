import { FileView } from "@/lib/components/dashboard/FileView";

export default function AllFilesPage() {
  return (
    <FileView
      view="all"
      title="All files"
      subtitle="All files you have access to"
    />
  );
}
