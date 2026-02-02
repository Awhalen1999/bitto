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
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        z_index?: number;
      };
    }) => updateAsset(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fileAssets(fileId),
      });
    },
  });
}
