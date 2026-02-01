"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreCanvas } from "@/lib/api/canvases";

export function useRestoreCanvas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreCanvas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvases"] });
    },
  });
}
