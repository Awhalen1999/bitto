"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { permanentDeleteCanvas } from "@/lib/api/canvases";

export function usePermanentDeleteCanvas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permanentDeleteCanvas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvases"] });
    },
  });
}
