"use client";

import { useQuery } from "@tanstack/react-query";
import { getFileAssets } from "@/lib/api/assets";
import { queryKeys } from "./queryKeys";

export function useFileAssets(fileId: string) {
  return useQuery({
    queryKey: queryKeys.fileAssets(fileId),
    queryFn: () => getFileAssets(fileId),
    enabled: !!fileId,
  });
}
