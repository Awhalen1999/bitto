"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createElement } from "@/lib/api/elements";
import type {
  ElementType,
  RectangleProps,
  LineProps,
  TextProps,
  AssetProps,
} from "@/lib/api/elements";
import { queryKeys } from "./queryKeys";

export type CreateElementInput = {
  type: ElementType;
  sort_index: number;
  props: RectangleProps | LineProps | TextProps | AssetProps;
};

export function useCreateElement(fileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateElementInput) =>
      createElement({
        file_id: fileId,
        type: input.type,
        sort_index: input.sort_index,
        props: input.props,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fileElements(fileId),
      });
    },
  });
}
