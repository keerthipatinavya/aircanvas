import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { DrawingStroke, DrawingTool, Point, GestureType } from '../types';
import { setupCanvasDPR, redrawCanvas, drawStroke } from '../utils/canvasUtils';
import { distance2D } from '../utils/gestureUtils';
import { Sparkles, MousePointer, Hand } from 'lucide-react';

interface DrawingCanvasProps {
  tool: DrawingTool;
  color: string;
  brushSize: number;
  bgColor: string;
  strokes: DrawingStroke[];
  onCommitStroke: (stroke: DrawingStroke) => void;
  // Hand tracking inputs
  cursorPosition: Point | null;
  normalizedCursorPosition?: Point | null;
  gesture: GestureType;
  handDetected: boolean;
  cameraActive: boolean;
  onStartCamera: () => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  tool,
  color,
  brushSize,
  bgColor,
  strokes,
  onCommitStroke,
  cursorPosition,
  normalizedCursorPosition,
  gesture,
  handDetected,
  cameraActive,
  onStartCamera,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas size state
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Active air stroke tracking ref
  const currentAirStrokeRef = useRef<DrawingStroke | null>(null);
  const lastAirPointRef = useRef<Point | null>(null);

  // Mouse / Pointer active stroke state
  const isPointerDownRef = useRef<boolean>(false);
  const currentPointerStrokeRef = useRef<DrawingStroke | null>(null);
  const pointerStartPointRef = useRef<Point | null>(null);

  // Measure container and handle window resize
  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth > 0 && clientHeight > 0) {
      setDimensions({ width: clientWidth, height: clientHeight });
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  // Reconfigure canvases on dimension change
  useEffect(() => {
    const mainCanvas = mainCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!mainCanvas || !previewCanvas) return;

    const mainCtx = mainCanvas.getContext('2d');
    const prevCtx = previewCanvas.getContext('2d');
    if (!mainCtx || !prevCtx) return;

    setupCanvasDPR(mainCanvas, mainCtx, dimensions.width, dimensions.height);
    setupCanvasDPR(previewCanvas, prevCtx, dimensions.width, dimensions.height);

    // Redraw all committed strokes on the main canvas
    redrawCanvas(mainCtx, strokes, dimensions.width, dimensions.height);
  }, [dimensions, strokes]);

  // Compute canvas-relative air position (normalized or absolute)
  const activeAirPos: Point | null = useMemo(() => {
    if (normalizedCursorPosition) {
      return {
        x: normalizedCursorPosition.x * dimensions.width,
        y: normalizedCursorPosition.y * dimensions.height,
      };
    }
    return cursorPosition;
  }, [normalizedCursorPosition, dimensions.width, dimensions.height, cursorPosition]);

  // Air Drawing State Machine: Process activeAirPos and gesture from MediaPipe
  useEffect(() => {
    if (!cameraActive || !activeAirPos || !handDetected) {
      // If hand is lost or tracking stops, immediately finalize any active air stroke
      if (currentAirStrokeRef.current) {
        if (currentAirStrokeRef.current.points.length > 0) {
          onCommitStroke(currentAirStrokeRef.current);
        }
        currentAirStrokeRef.current = null;
        lastAirPointRef.current = null;
      }
      return;
    }

    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return;

    const isErasing = gesture === 'erase' || tool === 'eraser';
    const effectiveTool: DrawingTool = isErasing ? 'eraser' : tool;
    const effectiveSize = gesture === 'erase' ? Math.max(brushSize * 2.5, 32) : brushSize;

    if (gesture === 'draw' || gesture === 'erase') {
      // If switching between drawing and air eraser, commit previous stroke first
      if (currentAirStrokeRef.current && currentAirStrokeRef.current.tool !== effectiveTool) {
        if (currentAirStrokeRef.current.points.length > 0) {
          onCommitStroke(currentAirStrokeRef.current);
        }
        currentAirStrokeRef.current = null;
        lastAirPointRef.current = null;
      }

      if (!currentAirStrokeRef.current) {
        // Start new stroke
        const newStroke: DrawingStroke = {
          id: `air-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tool: effectiveTool,
          color,
          size: effectiveSize,
          points: [{ ...activeAirPos }],
        };
        currentAirStrokeRef.current = newStroke;
        lastAirPointRef.current = { ...activeAirPos };

        // Draw initial point
        drawStroke(ctx, newStroke);
      } else {
        // Continue active stroke if moved past small jitter threshold
        const lastPt = lastAirPointRef.current;
        if (lastPt && distance2D(lastPt, activeAirPos) >= 2.0) {
          currentAirStrokeRef.current.points.push({ ...activeAirPos });
          lastAirPointRef.current = { ...activeAirPos };

          // Incrementally draw the latest segment
          const pts = currentAirStrokeRef.current.points;
          if (pts.length >= 2) {
            ctx.save();
            if (effectiveTool === 'eraser') {
              ctx.globalCompositeOperation = 'destination-out';
              ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
              ctx.globalCompositeOperation = 'source-over';
              ctx.strokeStyle = color;
            }
            ctx.lineWidth = effectiveSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const pPrev = pts[pts.length - 2];
            const pCurr = pts[pts.length - 1];

            ctx.beginPath();
            ctx.moveTo(pPrev.x, pPrev.y);
            ctx.lineTo(pCurr.x, pCurr.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    } else {
      // Gesture is not 'draw' or 'erase' (hover, stop, etc.) -> Finalize stroke
      if (currentAirStrokeRef.current) {
        if (currentAirStrokeRef.current.points.length > 0) {
          onCommitStroke(currentAirStrokeRef.current);
        }
        currentAirStrokeRef.current = null;
        lastAirPointRef.current = null;
      }
    }
  }, [
    activeAirPos,
    gesture,
    handDetected,
    cameraActive,
    tool,
    color,
    brushSize,
    onCommitStroke,
  ]);

  // Pointer (Mouse / Touch) Event Handlers for Fallback and Shape Tools
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only handle primary pointer (left click or touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;
    const pt = getCanvasPoint(e);
    pointerStartPointRef.current = pt;

    const newStroke: DrawingStroke = {
      id: `pointer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tool,
      color,
      size: brushSize,
      points: [pt],
      startPoint: pt,
      endPoint: pt,
    };

    currentPointerStrokeRef.current = newStroke;

    if (tool === 'pen' || tool === 'eraser') {
      const mainCanvas = mainCanvasRef.current;
      if (mainCanvas) {
        const ctx = mainCanvas.getContext('2d');
        if (ctx) drawStroke(ctx, newStroke);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || !currentPointerStrokeRef.current) return;

    const pt = getCanvasPoint(e);

    if (tool === 'pen' || tool === 'eraser') {
      // Freehand drawing directly onto main canvas
      const stroke = currentPointerStrokeRef.current;
      const pts = stroke.points;
      const lastPt = pts[pts.length - 1];

      if (!lastPt || distance2D(lastPt, pt) >= 1.5) {
        stroke.points.push(pt);

        const mainCanvas = mainCanvasRef.current;
        if (mainCanvas) {
          const ctx = mainCanvas.getContext('2d');
          if (ctx) {
            ctx.save();
            if (tool === 'eraser') {
              ctx.globalCompositeOperation = 'destination-out';
              ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
              ctx.globalCompositeOperation = 'source-over';
              ctx.strokeStyle = color;
            }
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const pPrev = pts[pts.length - 2];
            ctx.beginPath();
            ctx.moveTo(pPrev.x, pPrev.y);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    } else {
      // Shape preview (Line, Rect, Circle) on the preview canvas
      const previewCanvas = previewCanvasRef.current;
      if (previewCanvas) {
        const ctx = previewCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, dimensions.width, dimensions.height);
          const previewStroke: DrawingStroke = {
            ...currentPointerStrokeRef.current,
            endPoint: pt,
          };
          drawStroke(ctx, previewStroke, { isPreview: true });
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || !currentPointerStrokeRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore capture release error if already released
    }

    isPointerDownRef.current = false;
    const pt = getCanvasPoint(e);
    const stroke = currentPointerStrokeRef.current;

    // Clear preview canvas
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const ctx = previewCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    }

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      stroke.endPoint = pt;
      const mainCanvas = mainCanvasRef.current;
      if (mainCanvas) {
        const ctx = mainCanvas.getContext('2d');
        if (ctx) drawStroke(ctx, stroke);
      }
    }

    onCommitStroke(stroke);
    currentPointerStrokeRef.current = null;
    pointerStartPointRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none touch-none"
      style={{ backgroundColor: bgColor }}
    >
      {/* Committed artwork layer */}
      <canvas
        ref={mainCanvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />

      {/* Interactive preview & pointer capture layer */}
      <canvas
        ref={previewCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-0 block w-full h-full cursor-crosshair z-10"
      />

      {/* Fingertip Air Cursor Indicator */}
      {cameraActive && activeAirPos && (
        <div
          className="pointer-events-none absolute z-30 transition-transform duration-75 ease-out"
          style={{
            transform: `translate3d(${activeAirPos.x}px, ${activeAirPos.y}px, 0) translate(-50%, -50%)`,
          }}
        >
          {gesture === 'erase' ? (
            // Active Erase Cursor: Wide glowing rose eraser circle (Open Palm)
            <div className="relative flex items-center justify-center">
              <div
                className="rounded-full animate-ping opacity-60 bg-rose-500"
                style={{
                  width: `${Math.max(brushSize * 2.5, 32)}px`,
                  height: `${Math.max(brushSize * 2.5, 32)}px`,
                }}
              />
              <div
                className="absolute rounded-full border-2 border-white shadow-[0_0_15px_rgba(244,63,94,0.9)] bg-rose-500/80"
                style={{
                  width: `${Math.max(brushSize * 2.5, 32)}px`,
                  height: `${Math.max(brushSize * 2.5, 32)}px`,
                }}
              />
              <span className="absolute -bottom-7 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-black/85 text-rose-300 border border-rose-500/50 shadow-lg whitespace-nowrap">
                🧹 Erasing (Open Palm)
              </span>
            </div>
          ) : gesture === 'draw' ? (
            // Active Drawing Cursor: Pulsing glowing circle
            <div className="relative flex items-center justify-center">
              <div
                className="w-7 h-7 rounded-full animate-ping opacity-75"
                style={{ backgroundColor: tool === 'eraser' ? '#F43F5E' : color }}
              />
              <div
                className="absolute w-5 h-5 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.9)]"
                style={{ backgroundColor: tool === 'eraser' ? '#F43F5E' : color }}
              />
              <span className="absolute -bottom-6 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-black/80 text-cyan-300 border border-cyan-500/40">
                {tool === 'eraser' ? 'Erasing' : 'Drawing'}
              </span>
            </div>
          ) : gesture === 'hover' ? (
            // Hover / Moving Cursor: Targeting reticle
            <div className="relative flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-amber-400 animate-spin" />
              <div className="absolute w-2 h-2 rounded-full bg-amber-400" />
              <span className="absolute -bottom-6 px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/80 text-amber-300 border border-amber-500/40">
                Hover
              </span>
            </div>
          ) : (
            // Inactive Hand Cursor: Subtle dot
            <div className="w-3 h-3 rounded-full bg-slate-400/60 border border-white/50" />
          )}
        </div>
      )}

      {/* Empty State Banner when Canvas is clean */}
      {strokes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="max-w-md mx-6 p-6 rounded-3xl bg-[#0d1424]/60 backdrop-blur-md border border-slate-800/60 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-cyan-500/30 border border-violet-500/30 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1 font-['Outfit']">
              Virtual Air Canvas Ready
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Experience touchless creation powered by real-time hand computer vision.
            </p>

            <div className="grid grid-cols-2 gap-2 text-left text-xs mb-4">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div className="flex items-center gap-1.5 font-semibold text-violet-300 mb-1">
                  <Hand className="w-4 h-4 text-violet-400" />
                  Air Gesture
                </div>
                <p className="text-[11px] text-slate-400">
                  Point index finger to draw in mid-air.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div className="flex items-center gap-1.5 font-semibold text-cyan-300 mb-1">
                  <MousePointer className="w-4 h-4 text-cyan-400" />
                  Mouse & Touch
                </div>
                <p className="text-[11px] text-slate-400">
                  Click and drag to sketch anytime.
                </p>
              </div>
            </div>

            {!cameraActive && (
              <button
                onClick={onStartCamera}
                className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium text-xs shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Start Camera to Draw in the Air
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
