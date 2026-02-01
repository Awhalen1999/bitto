"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-xl font-bold text-white mb-2">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="text-sm text-neutral-400 mb-6">{description}</Dialog.Description>
          )}
          {children}
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
