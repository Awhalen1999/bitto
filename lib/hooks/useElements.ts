"use client";

import { useQuery } from "@tanstack/react-query";
import { getElements } from "@/lib/api/elements";
import { queryKeys } from "./queryKeys";

export function useElements(fileId: string) {
  return useQuery({
    queryKey: queryKeys.fileElements(fileId),
    queryFn: () => getElements(fileId),
    enabled: !!fileId,
  });
}
