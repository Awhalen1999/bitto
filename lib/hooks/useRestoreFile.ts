"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreFile } from "@/lib/api/files";

export function useRestoreFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
