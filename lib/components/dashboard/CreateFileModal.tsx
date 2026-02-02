"use client";

import { useState } from "react";
import { Modal } from "@/lib/components/shared/Modal";
import { useRouter } from "next/navigation";
import { useCreateFile } from "@/lib/hooks/useCreateFile";

interface CreateFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFileModal({
  open,
  onOpenChange,
}: CreateFileModalProps) {
  const [name, setName] = useState("");
  const router = useRouter();
  const { mutate: createFile, isPending } = useCreateFile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    createFile(
      { name: name.trim(), file_type: "canvas" },
      {
        onSuccess: (file) => {
          onOpenChange(false);
          setName("");
          router.push(`/canvas/${file.id}`);
        },
        onError: (error) => {
          console.error("Failed to create file:", error);
          // TODO: Show error toast
        },
      },
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setName("");
      onOpenChange(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Create new file"
      description="Give your file a name to get started"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="file-name" className="block text-sm font-medium text-neutral-300 mb-2">
            File name
          </label>
          <input
            id="file-name"
            type="text"
            placeholder="My new file"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            autoFocus
            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create file"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
