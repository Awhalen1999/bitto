"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateFile } from "@/lib/api/files";
import { queryKeys } from "./queryKeys";

export function useUpdateFile(fileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string }) => updateFile(fileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.file(fileId) });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
