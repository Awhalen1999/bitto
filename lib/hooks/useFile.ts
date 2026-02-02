"use client";

import { useQuery } from "@tanstack/react-query";
import { getFile } from "@/lib/api/files";
import { queryKeys } from "./queryKeys";

export function useFile(fileId: string) {
  return useQuery({
    queryKey: queryKeys.file(fileId),
    queryFn: () => getFile(fileId),
    enabled: !!fileId,
  });
}
