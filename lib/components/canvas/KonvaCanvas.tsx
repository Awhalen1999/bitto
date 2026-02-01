"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  Hand,
  Lock,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Undo2,
} from "lucide-react";
import { Stage, Layer, Rect, Line, Text } from "react-konva";
import type Konva from "konva";
import { useCanvas } from "@/lib/hooks/useCanvas";
import { useCanvasAssets } from "@/lib/hooks/useCanvasAssets";
import { useUpdateCanvas } from "@/lib/hooks/useUpdateCanvas";
import { useUpdateAsset } from "@/lib/hooks/useUpdateAsset";
import type { Asset } from "@/lib/api/assets";

const VIEWPORT_SAVE_DEBOUNCE_MS = 1500;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_INCREMENT = 0.1;

const CANVAS_SIZE = 8000;
const GRID_SPACING = 40;
const GRID_STROKE = "#404040"; /* neutral-700, visible on dark */
const GRID_STROKE_WIDTH = 0.5;
const CANVAS_FILL = "#171717"; /* neutral-900, matches Linear dark surface */

type CanvasTool = "lock" | "hand" | "pointer";

interface KonvaCanvasProps {
  canvasId: string;
}

export function KonvaCanvas({ canvasId }: KonvaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const viewportSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isSavingViewport, setIsSavingViewport] = useState(false);
  const [tool, setTool] = useState<CanvasTool>("hand");
  const [isPanning, setIsPanning] = useState(false);

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

  const zoomBy = useCallback(
    (direction: 1 | -1) => {
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewport.scale;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, oldScale + direction * ZOOM_INCREMENT),
      );
      if (newScale === oldScale) return;

      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const sceneX = (centerX - viewport.x) / oldScale;
      const sceneY = (centerY - viewport.y) / oldScale;
      const newX = centerX - sceneX * newScale;
      const newY = centerY - sceneY * newScale;

      stage.scale({ x: newScale, y: newScale });
      stage.position({ x: newX, y: newY });
      setViewport({ x: newX, y: newY, scale: newScale });
      saveViewport(newX, newY, newScale);
    },
    [viewport, dimensions, saveViewport],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomBy(1);
      } else if (e.key === "-") {
        e.preventDefault();
        zoomBy(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomBy]);

  const handleStageDragStart = useCallback(() => {
    setIsPanning(true);
  }, []);

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsPanning(false);
      const x = e.target.x();
      const y = e.target.y();
      const scale = stageRef.current?.scaleX() ?? viewport.scale;
      setViewport((prev) => ({ ...prev, x, y }));
      saveViewport(x, y, scale);
    },
    [viewport.scale, saveViewport],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const dx = e.evt.deltaX;
      const dy = e.evt.deltaY;
      const newX = viewport.x + dx;
      const newY = viewport.y + dy;

      stage.position({ x: newX, y: newY });
      setViewport((prev) => ({ ...prev, x: newX, y: newY }));
      saveViewport(newX, newY, viewport.scale);
    },
    [viewport, saveViewport],
  );

  const handleAssetDragEnd = useCallback(
    (assetId: string, x: number, y: number) => {
      updateAsset({ assetId, data: { x, y } });
    },
    [updateAsset],
  );

  const sortedAssets = [...assets].sort((a, b) => a.z_index - b.z_index);

  const gridLines = useMemo(() => {
    const half = CANVAS_SIZE / 2;
    const lines: [number, number, number, number][] = [];
    for (let i = -half; i <= half; i += GRID_SPACING) {
      lines.push([i, -half, i, half]);
      lines.push([-half, i, half, i]);
    }
    return lines;
  }, []);

  useEffect(() => {
    return () => {
      if (viewportSaveTimeoutRef.current) {
        clearTimeout(viewportSaveTimeoutRef.current);
      }
    };
  }, []);

  if (isCanvasLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-sm text-neutral-400">Loading canvas...</p>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-sm text-neutral-500">Canvas not found</p>
      </div>
    );
  }

  const half = CANVAS_SIZE / 2;

  const toolButtonClass =
    "flex h-8 w-8 items-center justify-center text-neutral-400 hover:bg-neutral-800 transition-colors";
  const toolButtonActiveClass = "bg-neutral-800 text-neutral-100";

  const cursorClass =
    tool === "lock"
      ? "cursor-not-allowed"
      : tool === "hand"
        ? isPanning
          ? "cursor-grabbing"
          : "cursor-grab"
        : "cursor-default";

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative bg-black ${cursorClass}`}
    >
      {/* Floating tool controller (Excalidraw-style) */}
      <div className="absolute top-3 left-3 z-10 cursor-pointer">
        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-sm">
          <button
            type="button"
            onClick={() => setTool("lock")}
            className={`rounded-l-md ${toolButtonClass} ${tool === "lock" ? toolButtonActiveClass : ""}`}
            title="Lock (no movement)"
            aria-label="Lock canvas"
            aria-pressed={tool === "lock"}
          >
            <Lock className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("hand")}
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "hand" ? toolButtonActiveClass : ""}`}
            title="Hand (pan canvas)"
            aria-label="Hand tool"
            aria-pressed={tool === "hand"}
          >
            <Hand className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("pointer")}
            className={`rounded-r-md border-l border-neutral-700 ${toolButtonClass} ${tool === "pointer" ? toolButtonActiveClass : ""}`}
            title="Pointer (select items)"
            aria-label="Pointer tool"
            aria-pressed={tool === "pointer"}
          >
            <MousePointer2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={tool === "hand"}
        onWheel={handleWheel}
        onDragStart={handleStageDragStart}
        onDragEnd={handleStageDragEnd}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
      >
        <Layer listening={false}>
          <Rect
            x={-half}
            y={-half}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            fill={CANVAS_FILL}
            listening={false}
          />
          {gridLines.map((points, i) => (
            <Line
              key={i}
              points={points}
              stroke={GRID_STROKE}
              strokeWidth={GRID_STROKE_WIDTH}
              listening={false}
            />
          ))}
        </Layer>
        <Layer>
          {sortedAssets.map((asset) => (
            <AssetNode
              key={asset.id}
              asset={asset}
              tool={tool}
              onDragEnd={handleAssetDragEnd}
            />
          ))}
        </Layer>
      </Stage>

      <div className="absolute bottom-3 left-3 flex cursor-pointer items-center gap-2">
        {/* Zoom: minus | % | plus (Excalidraw-style) */}
        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-sm">
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-l-md text-neutral-400 hover:bg-neutral-800"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            className="min-w-12 px-2 text-center text-xs font-medium text-neutral-300"
            aria-live="polite"
          >
            {Math.round(viewport.scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomBy(1)}
            className="flex h-8 w-8 items-center justify-center rounded-r-md text-neutral-400 hover:bg-neutral-800"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Undo / Redo (placeholder – log only for now) */}
        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-sm">
          <button
            type="button"
            onClick={() => console.log("undo")}
            className="flex h-8 w-8 items-center justify-center rounded-l-md text-neutral-400 hover:bg-neutral-800"
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => console.log("redo")}
            className="flex h-8 w-8 items-center justify-center rounded-r-md border-l border-neutral-700 text-neutral-400 hover:bg-neutral-800"
            title="Redo"
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {isSavingViewport && (
          <span className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-500">
            Saving…
          </span>
        )}
      </div>
    </div>
  );
}

interface AssetNodeProps {
  asset: Asset;
  tool: CanvasTool;
  onDragEnd: (assetId: string, x: number, y: number) => void;
}

function AssetNode({ asset, tool, onDragEnd }: AssetNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const draggable = tool === "pointer";

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
        draggable={draggable}
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
