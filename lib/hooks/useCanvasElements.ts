"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getElements,
  createElement,
  updateElement,
  deleteElement,
  type Element,
  type ElementType,
  type RectangleProps,
  type LineProps,
  type TextProps,
  type AssetProps,
} from "@/lib/api/elements";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

const SAVE_DEBOUNCE_MS = 10_000;
const TEMP_ID_PREFIX = "temp-";
const LOG_PREFIX = "[Canvas]";

function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX);
}

function generateTempId(): string {
  return `${TEMP_ID_PREFIX}${crypto.randomUUID()}`;
}

function elementPropsEqual(
  a: Element["props"],
  b: Element["props"],
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useCanvasElements(fileId: string) {
  const queryClient = useQueryClient();
  const [elements, setElements] = useState<Element[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const lastSavedRef = useRef<Element[]>([]);
  const elementsRef = useRef<Element[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  const { data: serverElements, isLoading } = useQuery({
    queryKey: queryKeys.fileElements(fileId),
    queryFn: () => getElements(fileId),
    enabled: !!fileId,
  });

  // Sync from server on initial load
  useEffect(() => {
    if (!serverElements || !fileId) return;
    if (!isInitializedRef.current) {
      console.log(`${LOG_PREFIX} Synced ${serverElements.length} elements from server (fileId: ${fileId})`);
      elementsRef.current = serverElements;
      setElements(serverElements);
      lastSavedRef.current = serverElements;
      isInitializedRef.current = true;
    }
  }, [serverElements, fileId]);

  const flushToServer = useCallback(async () => {
    if (!fileId) return;
    debounceTimerRef.current = null;

    const current = elementsRef.current;
    const lastSaved = lastSavedRef.current;

    const lastSavedById = new Map(lastSaved.map((el) => [el.id, el]));
    const currentById = new Map(current.map((el) => [el.id, el]));

    const toCreate = current.filter((el) => isTempId(el.id));
    const toDelete = lastSaved.filter(
      (el) => !isTempId(el.id) && !currentById.has(el.id),
    );
    const toUpdate = current.filter((el) => {
      if (isTempId(el.id)) return false;
      const prev = lastSavedById.get(el.id);
      if (!prev) return false;
      return (
        prev.sort_index !== el.sort_index ||
        !elementPropsEqual(prev.props, el.props)
      );
    });

    if (toCreate.length === 0 && toDelete.length === 0 && toUpdate.length === 0) {
      console.log(`${LOG_PREFIX} Flush skipped (no changes) — current: ${current.length}, lastSaved: ${lastSaved.length}`);
      return;
    }

    console.log(`${LOG_PREFIX} Flushing to server: ${toCreate.length} create, ${toUpdate.length} update, ${toDelete.length} delete`);

    if (isMountedRef.current) setIsSaving(true);

    try {
      const created: Element[] = [];
      for (const el of toCreate) {
        const createdEl = await createElement({
          file_id: fileId,
          type: el.type,
          sort_index: el.sort_index,
          props: el.props,
        });
        created.push(createdEl);
      }

      await Promise.all([
        ...toDelete.map((el) => deleteElement(el.id)),
        ...toUpdate.map((el) =>
          updateElement(el.id, {
            sort_index: el.sort_index,
            props: el.props,
          }),
        ),
      ]);

      const tempToReal = new Map<string, Element>();
      toCreate.forEach((el, i) => tempToReal.set(el.id, created[i]));

      const resolvedElements = current
        .map((el) => tempToReal.get(el.id) ?? el)
        .filter((el) => !toDelete.some((d) => d.id === el.id));

      lastSavedRef.current = resolvedElements;
      if (isMountedRef.current) {
        setElements(resolvedElements);
        setLastSavedAt(new Date());
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.fileElements(fileId),
      });
      console.log(`${LOG_PREFIX} Flush complete (${resolvedElements.length} elements)`);
    } catch (err) {
      console.error(`${LOG_PREFIX} Flush failed:`, err);
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  }, [fileId, queryClient]);

  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      console.log(`${LOG_PREFIX} Debounce timer reset (${SAVE_DEBOUNCE_MS}ms)`);
    } else {
      console.log(`${LOG_PREFIX} Debounce timer started (${SAVE_DEBOUNCE_MS}ms)`);
    }
    debounceTimerRef.current = setTimeout(() => {
      flushToServer();
    }, SAVE_DEBOUNCE_MS);
  }, [flushToServer]);

  const createElementLocal = useCallback(
    (input: {
      type: ElementType;
      sort_index: number;
      props: RectangleProps | LineProps | TextProps | AssetProps;
    }) => {
      const tempElement: Element = {
        id: generateTempId(),
        file_id: fileId,
        type: input.type,
        sort_index: input.sort_index,
        props: input.props,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const prev = elementsRef.current;
      const next = [...prev, tempElement].sort((a, b) => a.sort_index - b.sort_index);
      elementsRef.current = next;
      setElements(next);
      console.log(`${LOG_PREFIX} Create local: ${input.type} (tempId: ${tempElement.id}, total: ${next.length})`);
      scheduleSave();
      return tempElement.id;
    },
    [fileId, scheduleSave],
  );

  const updateElementLocal = useCallback(
    (
      elementId: string,
      data: {
        sort_index?: number;
        props?: Partial<
          RectangleProps | LineProps | TextProps | AssetProps
        >;
      },
    ) => {
      const prev = elementsRef.current;
      const next = prev.map((el) =>
        el.id === elementId
          ? {
              ...el,
              sort_index: data.sort_index ?? el.sort_index,
              props: { ...el.props, ...data.props } as Element["props"],
              updated_at: new Date().toISOString(),
            }
          : el,
      );
      elementsRef.current = next;
      setElements(next);
      console.log(`${LOG_PREFIX} Update local: ${elementId}`, data);
      scheduleSave();
    },
    [scheduleSave],
  );

  const deleteElementLocal = useCallback(
    (elementId: string) => {
      console.log(`${LOG_PREFIX} Delete local: ${elementId}`);
      const prev = elementsRef.current;
      const next = prev.filter((el) => el.id !== elementId);
      elementsRef.current = next;
      setElements(next);
      scheduleSave();
    },
    [scheduleSave],
  );

  // Reset on fileId change; flush on unmount if timer active
  useEffect(() => {
    isMountedRef.current = true;
    isInitializedRef.current = false;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        console.log(`${LOG_PREFIX} Unmount: flushing pending changes (${elementsRef.current.length} elements)`);
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        flushToServer();
      }
    };
  }, [fileId, flushToServer]);

  return {
    elements,
    isLoading,
    isSaving,
    lastSavedAt,
    createElement: createElementLocal,
    updateElement: updateElementLocal,
    deleteElement: deleteElementLocal,
    flushNow: flushToServer,
  };
}
