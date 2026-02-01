"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import type Konva from "konva";
import { useCanvas } from "@/lib/hooks/useCanvas";
import { useCanvasAssets } from "@/lib/hooks/useCanvasAssets";
import { useUpdateCanvas } from "@/lib/hooks/useUpdateCanvas";
import { useUpdateAsset } from "@/lib/hooks/useUpdateAsset";
import type { Asset } from "@/lib/api/assets";

const VIEWPORT_SAVE_DEBOUNCE_MS = 1500;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_FACTOR = 1.08;

interface KonvaCanvasProps {
  canvasId: string;
}

export function KonvaCanvas({ canvasId }: KonvaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const viewportSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isSavingViewport, setIsSavingViewport] = useState(false);

  const { data: canvas, isLoading: isCanvasLoading } = useCanvas(canvasId);
  const { data: assets = [] } = useCanvasAssets(canvasId);
  const { mutate: updateCanvas } = useUpdateCanvas(canvasId);
  const { mutate: updateAsset } = useUpdateAsset(canvasId);
  const hasSyncedViewportRef = useRef(false);

  // Sync viewport from server once when canvas first loads (deferred to avoid sync setState in effect)
  useEffect(() => {
    if (!canvas || hasSyncedViewportRef.current) return;
    hasSyncedViewportRef.current = true;
    const v = {
      x: canvas.viewport_x,
      y: canvas.viewport_y,
      scale: canvas.viewport_scale,
    };
    queueMicrotask(() => setViewport(v));
  }, [canvas]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.offsetWidth || 800;
      const h = el.offsetHeight || 600;
      setDimensions({ width: w, height: h });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const saveViewport = useCallback(
    (x: number, y: number, scale: number) => {
      if (viewportSaveTimeoutRef.current) {
        clearTimeout(viewportSaveTimeoutRef.current);
      }

      viewportSaveTimeoutRef.current = setTimeout(() => {
        setIsSavingViewport(true);
        updateCanvas(
          { viewport_x: x, viewport_y: y, viewport_scale: scale },
          {
            onSettled: () => {
              setIsSavingViewport(false);
              viewportSaveTimeoutRef.current = null;
            },
          },
        );
      }, VIEWPORT_SAVE_DEBOUNCE_MS);
    },
    [updateCanvas],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const oldScale = stage.scaleX();
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, oldScale * SCALE_FACTOR ** direction),
      );

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);

      setViewport({ x: newPos.x, y: newPos.y, scale: newScale });
      saveViewport(newPos.x, newPos.y, newScale);
    },
    [saveViewport],
  );

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const x = e.target.x();
      const y = e.target.y();
      const scale = stageRef.current?.scaleX() ?? viewport.scale;
      setViewport((prev) => ({ ...prev, x, y }));
      saveViewport(x, y, scale);
    },
    [viewport.scale, saveViewport],
  );

  const handleAssetDragEnd = useCallback(
    (assetId: string, x: number, y: number) => {
      updateAsset({ assetId, data: { x, y } });
    },
    [updateAsset],
  );

  const sortedAssets = [...assets].sort((a, b) => a.z_index - b.z_index);

  useEffect(() => {
    return () => {
      if (viewportSaveTimeoutRef.current) {
        clearTimeout(viewportSaveTimeoutRef.current);
      }
    };
  }, []);

  if (isCanvasLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
        <p className="text-sm text-zinc-400">Loading canvas...</p>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
        <p className="text-sm text-zinc-500">Canvas not found</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-zinc-900">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
      >
        <Layer>
          {sortedAssets.map((asset) => (
            <AssetNode
              key={asset.id}
              asset={asset}
              onDragEnd={handleAssetDragEnd}
            />
          ))}
        </Layer>
      </Stage>

      {isSavingViewport && (
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-zinc-800/90 text-zinc-400 text-xs">
          Saving…
        </div>
      )}
    </div>
  );
}

interface AssetNodeProps {
  asset: Asset;
  onDragEnd: (assetId: string, x: number, y: number) => void;
}

function AssetNode({ asset, onDragEnd }: AssetNodeProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <>
      <Rect
        x={asset.x}
        y={asset.y}
        width={asset.width}
        height={asset.height}
        fill={isDragging ? "#6b7280" : "#4b5563"}
        stroke="#71717a"
        strokeWidth={1}
        draggable
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(e) => {
          setIsDragging(false);
          onDragEnd(asset.id, e.target.x(), e.target.y());
        }}
      />
      <Text
        x={asset.x}
        y={asset.y + asset.height / 2 - 8}
        width={asset.width}
        text={asset.name}
        fontSize={12}
        fontFamily="Inter, sans-serif"
        fill="white"
        align="center"
        listening={false}
      />
    </>
  );
}
