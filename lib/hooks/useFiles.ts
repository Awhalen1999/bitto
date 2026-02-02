"use client";

import { useQuery } from "@tanstack/react-query";
import { getFiles, ViewType } from "@/lib/api/files";
import { SortOption } from "@/lib/components/dashboard/DashboardHeader";
import { queryKeys } from "./queryKeys";

export function useFiles(view: ViewType, sortBy: SortOption) {
  return useQuery({
    queryKey: queryKeys.files(view, sortBy),
    queryFn: () => getFiles(view, sortBy),
  });
}
