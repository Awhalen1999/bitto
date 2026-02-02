"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAsset } from "@/lib/api/assets";
import { queryKeys } from "./queryKeys";

export function useUpdateAsset(fileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string;
      data: {
        name?: string;
        thumbnail_url?: string;
        metadata?: Record<string, unknown>;
      };
    }) => updateAsset(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fileAssets(fileId),
      });
    },
  });
}
