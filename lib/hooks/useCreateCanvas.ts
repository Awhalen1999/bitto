"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCanvas } from "@/lib/api/canvases";

export function useCreateCanvas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCanvas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvases"] });
    },
  });
}
