"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import type Konva from "konva";
import { useCanvas } from "@/lib/hooks/useCanvas";
import { useUpdateCanvas } from "@/lib/hooks/useUpdateCanvas";
import type { CanvasData, CanvasObject } from "@/lib/api/canvases";
import React from "react";

interface KonvaCanvasProps {
  canvasId: string;
}

export function KonvaCanvas({ canvasId }: KonvaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  // Container dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch canvas from backend
  const { data: canvas, isLoading } = useCanvas(canvasId);
  const { mutate: updateCanvas } = useUpdateCanvas(canvasId);

  // Canvas data is always valid from backend now
  const serverCanvasData = useMemo(() => {
    if (!canvas?.canvas_data) {
      console.log("⚠️ [KONVA] No canvas data from server (should not happen)");
      return {
        version: 1,
        objects: [],
        viewport: { x: 0, y: 0, scale: 1 },
      };
    }

    console.log("📦 [KONVA] Loaded canvas data from server", {
      objectCount: canvas.canvas_data.objects.length,
      viewport: canvas.canvas_data.viewport,
    });

    return canvas.canvas_data;
  }, [canvas?.canvas_data]);

  // Local state for optimistic updates
  const [localCanvasData, setLocalCanvasData] = useState<CanvasData | null>(
    null,
  );

  // Current canvas data (local overrides server)
  const currentCanvasData = localCanvasData ?? serverCanvasData;

  // Measure container
  const measureContainer = useCallback(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
      console.log("📐 [KONVA] Container measured", {
        width: offsetWidth,
        height: offsetHeight,
      });
    }
  }, []);

  // Handle resize with ResizeObserver
  const observeResize = useCallback(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      measureContainer();
    });

    resizeObserver.observe(containerRef.current);
    measureContainer();

    return () => resizeObserver.disconnect();
  }, [measureContainer]);

  // Setup resize observer
  React.useEffect(() => {
    return observeResize();
  }, [observeResize]);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (data: CanvasData) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        console.log("⏱️ [KONVA] Save debounced - resetting 8s timer");
      }

      saveTimeoutRef.current = setTimeout(() => {
        const now = Date.now();
        const timeSinceLastSave = now - lastSaveTimeRef.current;

        console.log("💾 [KONVA] Initiating auto-save", {
          canvasId,
          objectCount: data.objects.length,
          viewport: data.viewport,
          timeSinceLastSave: `${(timeSinceLastSave / 1000).toFixed(1)}s`,
        });

        setIsSaving(true);
        const saveStartTime = performance.now();

        updateCanvas(
          { canvas_data: data },
          {
            onSuccess: () => {
              const duration = performance.now() - saveStartTime;
              lastSaveTimeRef.current = now;
              setIsSaving(false);
              setLocalCanvasData(null);
              console.log("✅ [KONVA] Auto-save successful", {
                duration: `${duration.toFixed(2)}ms`,
              });
            },
            onError: (error) => {
              const duration = performance.now() - saveStartTime;
              setIsSaving(false);
              console.error("❌ [KONVA] Auto-save failed", {
                duration: `${duration.toFixed(2)}ms`,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            },
          },
        );
      }, 8000);
    },
    [updateCanvas, canvasId],
  );

  // Update canvas data
  const updateCanvasData = useCallback(
    (updater: (prev: CanvasData) => CanvasData) => {
      const newData = updater(currentCanvasData);
      setLocalCanvasData(newData);
      debouncedSave(newData);
    },
    [currentCanvasData, debouncedSave],
  );

  // Handle object drag
  const handleObjectDragEnd = useCallback(
    (objectId: string, x: number, y: number) => {
      console.log("🎯 [KONVA] Object moved", {
        objectId,
        position: { x, y },
      });

      updateCanvasData((prev) => ({
        ...prev,
        objects: prev.objects.map((obj) =>
          obj.id === objectId ? { ...obj, x, y } : obj,
        ),
      }));
    },
    [updateCanvasData],
  );

  // Handle viewport zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.05;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.max(
        0.1,
        Math.min(5, oldScale * scaleBy ** direction),
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

      console.log("🔍 [KONVA] Zoom", {
        oldScale: oldScale.toFixed(2),
        newScale: newScale.toFixed(2),
      });

      updateCanvasData((prev) => ({
        ...prev,
        viewport: { x: newPos.x, y: newPos.y, scale: newScale },
      }));
    },
    [updateCanvasData],
  );

  // Handle viewport pan
  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const x = e.target.x();
      const y = e.target.y();

      console.log("👆 [KONVA] Canvas panned", { x, y });

      updateCanvasData((prev) => ({
        ...prev,
        viewport: { ...prev.viewport, x, y },
      }));
    },
    [updateCanvasData],
  );

  // Add test object
  const addPlaceholder = useCallback(() => {
    const objectCount = currentCanvasData.objects.length;

    const newObject: CanvasObject = {
      id: `obj-${Date.now()}`,
      type: "asset",
      x: 100 + objectCount * 20,
      y: 100 + objectCount * 20,
      width: 120,
      height: 80,
      zIndex: objectCount,
      label: `Asset ${objectCount + 1}`,
    };

    console.log("➕ [KONVA] Adding object", {
      id: newObject.id,
      totalObjects: objectCount + 1,
    });

    updateCanvasData((prev) => ({
      ...prev,
      objects: [...prev.objects, newObject],
    }));
  }, [currentCanvasData, updateCanvasData]);

  // Cleanup on unmount
  React.useEffect(() => {
    console.log("🚀 [KONVA] Canvas mounted", { canvasId });

    return () => {
      console.log("🔥 [KONVA] Canvas unmounting", { canvasId });
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [canvasId]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        <p className="text-zinc-400">Loading canvas...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-zinc-900">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={addPlaceholder}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-lg"
        >
          Add Placeholder
        </button>
        <div className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-sm flex items-center gap-3 shadow-lg">
          <span>Objects: {currentCanvasData.objects.length}</span>
          <span className="text-zinc-600">|</span>
          <span>
            Zoom: {Math.round(currentCanvasData.viewport.scale * 100)}%
          </span>
          {isSaving && (
            <>
              <span className="text-zinc-600">|</span>
              <span className="text-purple-400 animate-pulse">Saving...</span>
            </>
          )}
        </div>
      </div>

      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        x={currentCanvasData.viewport.x}
        y={currentCanvasData.viewport.y}
        scaleX={currentCanvasData.viewport.scale}
        scaleY={currentCanvasData.viewport.scale}
      >
        <Layer>
          {currentCanvasData.objects.map((obj) => (
            <CanvasObjectNode
              key={obj.id}
              object={obj}
              onDragEnd={handleObjectDragEnd}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

// Canvas object component
interface CanvasObjectNodeProps {
  object: CanvasObject;
  onDragEnd: (objectId: string, x: number, y: number) => void;
}

function CanvasObjectNode({ object, onDragEnd }: CanvasObjectNodeProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <>
      <Rect
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        fill={isDragging ? "#9333ea" : "#6b7280"}
        stroke="#e5e7eb"
        strokeWidth={2}
        draggable
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(e) => {
          setIsDragging(false);
          onDragEnd(object.id, e.target.x(), e.target.y());
        }}
        shadowColor="black"
        shadowBlur={isDragging ? 10 : 0}
        shadowOpacity={0.6}
      />
      <Text
        x={object.x}
        y={object.y + object.height / 2 - 10}
        width={object.width}
        text={object.label || "Asset"}
        fontSize={14}
        fontFamily="Inter, sans-serif"
        fill="white"
        align="center"
        listening={false}
      />
    </>
  );
}
