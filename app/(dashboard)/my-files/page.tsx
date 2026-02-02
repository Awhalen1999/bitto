import { FileView } from "@/lib/components/dashboard/FileView";

export default function MyFilesPage() {
  return (
    <FileView
      view="my-files"
      title="My files"
      subtitle="Files you created"
    />
  );
}
