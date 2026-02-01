"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCanvas } from "@/lib/api/canvases";

export function useDeleteCanvas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCanvas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvases"] });
    },
    onError: (error) => {
      console.error("❌ Delete canvas error:", error);
    },
  });
}
