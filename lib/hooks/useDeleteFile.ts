"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFile } from "@/lib/api/files";

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (error) => {
      console.error("❌ Delete file error:", error);
    },
  });
}
