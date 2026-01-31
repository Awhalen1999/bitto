"use client";

import { useQuery } from "@tanstack/react-query";
import { getCanvases, ViewType } from "@/lib/api/canvases";
import { SortOption } from "@/lib/components/dashboard/DashboardHeader";

export function useCanvases(view: ViewType, sortBy: SortOption) {
  return useQuery({
    queryKey: ["canvases", view, sortBy],
    queryFn: () => getCanvases(view, sortBy),
  });
}
