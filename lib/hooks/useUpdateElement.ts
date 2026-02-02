"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateElement } from "@/lib/api/elements";
import type {
  RectangleProps,
  LineProps,
  TextProps,
  AssetProps,
} from "@/lib/api/elements";
import { queryKeys } from "./queryKeys";

export function useUpdateElement(fileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      elementId,
      data,
    }: {
      elementId: string;
      data: UpdateElementPayload;
    }) => updateElement(elementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fileElements(fileId),
      });
    },
  });
}

export type UpdateElementPayload = {
  sort_index?: number;
  props?: Partial<
    RectangleProps | LineProps | TextProps | AssetProps
  >;
};
