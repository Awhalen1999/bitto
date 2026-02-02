"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { permanentDeleteFile } from "@/lib/api/files";

export function usePermanentDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permanentDeleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
