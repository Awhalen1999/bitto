"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAsset } from "@/lib/api/assets";
import { queryKeys } from "./queryKeys";

export function useCreateAsset(canvasId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.canvasAssets(canvasId),
      });
    },
  });
}
