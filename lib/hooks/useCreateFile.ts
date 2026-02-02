"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFile } from "@/lib/api/files";

export function useCreateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
