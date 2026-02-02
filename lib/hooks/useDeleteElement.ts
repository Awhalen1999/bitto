"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteElement } from "@/lib/api/elements";
import { queryKeys } from "./queryKeys";

export function useDeleteElement(fileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteElement,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fileElements(fileId),
      });
    },
  });
}
