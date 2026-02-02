"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  Hand,
  FilePlus,
  Lock,
  MessageSquare,
  Minus,
  MousePointer2,
  Move,
  PencilLine,
  Plus,
  Redo2,
  Square,
  Type,
  Undo2,
} from "lucide-react";
import { Stage, Layer, Group, Rect, Line, Text } from "react-konva";
import type Konva from "konva";
import { useFile } from "@/lib/hooks/useFile";
import { useFileAssets } from "@/lib/hooks/useFileAssets";
import { useUpdateAsset } from "@/lib/hooks/useUpdateAsset";
import type { Asset } from "@/lib/api/assets";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_INCREMENT = 0.1;

const CANVAS_SIZE = 8000;
const CANVAS_HALF = CANVAS_SIZE / 2;
const GRID_SPACING = 40;
const GRID_STROKE = "#404040";
const GRID_STROKE_WIDTH = 0.5;
const CANVAS_FILL = "#171717";

type CanvasTool =
  | "lock"
  | "hand"
  | "pointer"
  | "rectangle"
  | "line"
  | "text"
  | "asset"
  | "comment";

/** Keep the visible area inside the canvas so we never show black outside the grid. */
function clampViewport(
  x: number,
  y: number,
  scale: number,
  width: number,
  height: number,
) {
  const s = scale;
  const c = CANVAS_HALF;
  let minX = Math.max(width - c * s, -c * s);
  let maxX = Math.min(c * s, width + c * s);
  let minY = Math.max(height - c * s, -c * s);
  let maxY = Math.min(c * s, height + c * s);
  if (minX > maxX) {
    minX = -c * s;
    maxX = width + c * s;
  }
  if (minY > maxY) {
    minY = -c * s;
    maxY = height + c * s;
  }
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

interface KonvaCanvasProps {
  fileId: string;
}

export function KonvaCanvas({ fileId }: KonvaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [tool, setTool] = useState<CanvasTool>("hand");
  const [isPanning, setIsPanning] = useState(false);

  const { data: file, isLoading: isFileLoading } = useFile(fileId);
  const { data: assets = [] } = useFileAssets(fileId);
  const { mutate: updateAsset } = useUpdateAsset(fileId);

  const measureRef = useRef(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0 && h > 0) setDimensions({ width: w, height: h });
  });

  useLayoutEffect(() => {
    measureRef.current();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measureRef.current);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fileId]);

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
      let newX = centerX - sceneX * newScale;
      let newY = centerY - sceneY * newScale;
      const clamped = clampViewport(
        newX,
        newY,
        newScale,
        dimensions.width,
        dimensions.height,
      );
      newX = clamped.x;
      newY = clamped.y;

      stage.scale({ x: newScale, y: newScale });
      stage.position({ x: newX, y: newY });
      setViewport({ x: newX, y: newY, scale: newScale });
    },
    [viewport, dimensions],
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

  const handleStageDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const scale = stageRef.current?.scaleX() ?? viewport.scale;
      const { x, y } = clampViewport(
        e.target.x(),
        e.target.y(),
        scale,
        dimensions.width,
        dimensions.height,
      );
      setViewport((prev) => ({ ...prev, x, y }));
    },
    [viewport.scale, dimensions],
  );

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsPanning(false);
      const scale = stageRef.current?.scaleX() ?? viewport.scale;
      const { x, y } = clampViewport(
        e.target.x(),
        e.target.y(),
        scale,
        dimensions.width,
        dimensions.height,
      );
      stageRef.current?.position({ x, y });
      setViewport((prev) => ({ ...prev, x, y }));
    },
    [viewport.scale, dimensions],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      if (tool === "lock") return;
      const stage = stageRef.current;
      if (!stage) return;

      const dx = e.evt.deltaX;
      const dy = e.evt.deltaY;
      const { x: newX, y: newY } = clampViewport(
        viewport.x + dx,
        viewport.y + dy,
        viewport.scale,
        dimensions.width,
        dimensions.height,
      );

      stage.position({ x: newX, y: newY });
      setViewport((prev) => ({ ...prev, x: newX, y: newY }));
    },
    [tool, viewport, dimensions],
  );

  const centerView = useCallback(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const { x, y } = clampViewport(
      centerX,
      centerY,
      viewport.scale,
      dimensions.width,
      dimensions.height,
    );
    stageRef.current?.position({ x, y });
    setViewport((prev) => ({ ...prev, x, y }));
  }, [viewport.scale, dimensions]);

  const handleAssetDragEnd = useCallback(
    (assetId: string, x: number, y: number) => {
      updateAsset({ assetId, data: { x, y } });
    },
    [updateAsset],
  );

  const sortedAssets = [...assets].sort((a, b) => a.z_index - b.z_index);

  const stagePosition = useMemo(
    () =>
      dimensions.width > 0 && dimensions.height > 0
        ? clampViewport(
            viewport.x,
            viewport.y,
            viewport.scale,
            dimensions.width,
            dimensions.height,
          )
        : { x: viewport.x, y: viewport.y },
    [
      viewport.x,
      viewport.y,
      viewport.scale,
      dimensions.width,
      dimensions.height,
    ],
  );

  const gridLines = useMemo(() => {
    const lines: [number, number, number, number][] = [];
    for (let i = -CANVAS_HALF; i <= CANVAS_HALF; i += GRID_SPACING) {
      lines.push([i, -CANVAS_HALF, i, CANVAS_HALF]);
      lines.push([-CANVAS_HALF, i, CANVAS_HALF, i]);
    }
    return lines;
  }, []);

  if (isFileLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <p className="text-sm text-neutral-400">Loading canvas...</p>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <p className="text-sm text-neutral-500">Canvas not found</p>
      </div>
    );
  }

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
        : tool === "rectangle" ||
            tool === "line" ||
            tool === "text" ||
            tool === "asset" ||
            tool === "comment"
          ? "cursor-crosshair"
          : "cursor-default";

  if (dimensions.width <= 0 || dimensions.height <= 0) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 bg-black"
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 bg-black ${cursorClass}`}
    >
      <div className="absolute top-3 left-3 z-10 flex cursor-pointer items-center gap-2">
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
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "pointer" ? toolButtonActiveClass : ""}`}
            title="Pointer (select items)"
            aria-label="Pointer tool"
            aria-pressed={tool === "pointer"}
          >
            <MousePointer2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={centerView}
            className="rounded-r-md border-l border-neutral-700 flex h-8 w-8 items-center justify-center text-neutral-400 hover:bg-neutral-800 transition-colors"
            title="Center view at 0,0"
            aria-label="Center view"
          >
            <Move className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-sm">
          <button
            type="button"
            onClick={() => setTool("rectangle")}
            className={`rounded-l-md ${toolButtonClass} ${tool === "rectangle" ? toolButtonActiveClass : ""}`}
            title="Rectangle"
            aria-label="Rectangle (draw)"
            aria-pressed={tool === "rectangle"}
          >
            <Square className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("line")}
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "line" ? toolButtonActiveClass : ""}`}
            title="Line"
            aria-label="Line (draw)"
            aria-pressed={tool === "line"}
          >
            <PencilLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("text")}
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "text" ? toolButtonActiveClass : ""}`}
            title="Text"
            aria-label="Text (draw)"
            aria-pressed={tool === "text"}
          >
            <Type className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("asset")}
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "asset" ? toolButtonActiveClass : ""}`}
            title="Add asset (click canvas to upload at that spot)"
            aria-label="Add asset (upload)"
            aria-pressed={tool === "asset"}
          >
            <FilePlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("comment")}
            className={`rounded-r-md border-l border-neutral-700 ${toolButtonClass} ${tool === "comment" ? toolButtonActiveClass : ""}`}
            title="Add comment"
            aria-label="Add comment"
            aria-pressed={tool === "comment"}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={tool === "hand"}
        dragBoundFunc={(pos) =>
          clampViewport(
            pos.x,
            pos.y,
            viewport.scale,
            dimensions.width,
            dimensions.height,
          )
        }
        onWheel={handleWheel}
        onDragStart={handleStageDragStart}
        onDragMove={handleStageDragMove}
        onDragEnd={handleStageDragEnd}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
      >
        <Layer listening={false}>
          <Rect
            x={-CANVAS_HALF}
            y={-CANVAS_HALF}
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

        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-sm">
          <button
            type="button"
            disabled
            className="flex h-8 w-8 items-center justify-center rounded-l-md text-neutral-500 cursor-not-allowed"
            title="Undo (coming soon)"
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            className="flex h-8 w-8 items-center justify-center rounded-r-md border-l border-neutral-700 text-neutral-500 cursor-not-allowed"
            title="Redo (coming soon)"
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
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

  const dragBoundFunc = useCallback(
    (pos: { x: number; y: number }) => ({
      x: Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF - asset.width, pos.x)),
      y: Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF - asset.height, pos.y)),
    }),
    [asset.width, asset.height],
  );

  return (
    <Group
      x={asset.x}
      y={asset.y}
      draggable={draggable}
      dragBoundFunc={dragBoundFunc}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e) => {
        setIsDragging(false);
        onDragEnd(asset.id, e.target.x(), e.target.y());
      }}
    >
      <Rect
        x={0}
        y={0}
        width={asset.width}
        height={asset.height}
        fill={isDragging ? "#52525b" : "#404040"}
        stroke="#52525b"
        strokeWidth={1}
        listening={true}
      />
      <Text
        x={0}
        y={asset.height / 2 - 8}
        width={asset.width}
        text={asset.name}
        fontSize={12}
        fontFamily="system-ui, sans-serif"
        fill="white"
        align="center"
        listening={false}
      />
    </Group>
  );
}
