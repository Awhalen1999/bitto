"use client";

import { useState } from "react";
import { Modal } from "@/lib/components/shared/Modal";
import { useRouter } from "next/navigation";
import { useCreateCanvas } from "@/lib/hooks/useCreateCanvas";

interface CreateCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCanvasModal({
  open,
  onOpenChange,
}: CreateCanvasModalProps) {
  const [name, setName] = useState("");
  const router = useRouter();
  const { mutate: createCanvas, isPending } = useCreateCanvas();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    createCanvas(
      { name: name.trim() },
      {
        onSuccess: (canvas) => {
          onOpenChange(false);
          setName("");
          // Navigate to the new canvas editor
          router.push(`/canvas/${canvas.id}`);
        },
        onError: (error) => {
          console.error("Failed to create canvas:", error);
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
      title="Create new canvas"
      description="Give your canvas a name to get started"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="canvas-name"
            className="block text-sm font-medium text-zinc-300 mb-2"
          >
            Canvas name
          </label>
          <input
            id="canvas-name"
            type="text"
            placeholder="My awesome game design"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            autoFocus
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create canvas"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
