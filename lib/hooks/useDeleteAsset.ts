"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAsset } from "@/lib/api/assets";
import { queryKeys } from "./queryKeys";

export function useDeleteAsset(fileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fileAssets(fileId),
      });
    },
  });
}
