import { useState, useCallback, useEffect } from 'react';
import type {
  DrawingStroke,
  DrawingTool,
} from './types';
import { useHandTracking } from './hooks/useHandTracking';
import { exportCanvasAsPNG } from './utils/canvasUtils';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { DrawingCanvas } from './components/DrawingCanvas';
import { CameraPreview } from './components/CameraPreview';
import { StatusIndicator } from './components/StatusIndicator';
import { ConfirmationModal } from './components/ConfirmationModal';
import { GestureGuideModal } from './components/GestureGuideModal';
import { AboutModal } from './components/AboutModal';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  // Canvas drawing state
  const [activeTool, setActiveTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState<string>('#06B6D4');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [bgColor, setBgColor] = useState<string>('#090d16');

  // Stroke history stacks for undo / redo
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingStroke[]>([]);

  // UI state
  const [showWebcamPreview, setShowWebcamPreview] = useState<boolean>(true);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);

  // Initialize Hand Tracking hook
  const {
    state: trackingState,
    videoRef,
    startCamera,
    stopCamera,
    retry,
  } = useHandTracking({
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
  });

  // Handle stroke commitment from pointer or air gesture
  const handleCommitStroke = useCallback((newStroke: DrawingStroke) => {
    setStrokes((prev) => [...prev, newStroke]);
    // Clear redo history when a new stroke is committed
    setRedoStack([]);
  }, []);

  // Undo action
  const handleUndo = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, prev.length - 1);
    });
  }, []);

  // Redo action
  const handleRedo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const nextStroke = prevRedo[prevRedo.length - 1];
      setStrokes((s) => [...s, nextStroke]);
      return prevRedo.slice(0, prevRedo.length - 1);
    });
  }, []);

  // Clear canvas action
  const handleConfirmClear = useCallback(() => {
    setStrokes([]);
    setRedoStack([]);
    setIsClearModalOpen(false);
  }, []);

  // PNG Export
  const handleExportPNG = useCallback(() => {
    exportCanvasAsPNG(strokes, window.innerWidth, window.innerHeight, bgColor);
  }, [strokes, bgColor]);

  // Fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'z')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Tool shortcuts
      if (key === 'p') setActiveTool('pen');
      if (key === 'e') setActiveTool('eraser');
      if (key === 'l') setActiveTool('line');
      if (key === 'r') setActiveTool('rect');
      if (key === 'c') setActiveTool('circle');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090d16] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Top Navigation */}
      <TopBar
        cameraActive={trackingState.cameraActive}
        cameraStatus={trackingState.cameraStatus}
        modelStatus={trackingState.modelStatus}
        fps={trackingState.fps}
        showWebcamPreview={showWebcamPreview}
        showLandmarks={showLandmarks}
        isFullscreen={isFullscreen}
        onToggleCamera={() => {
          if (trackingState.cameraActive) {
            stopCamera();
          } else {
            startCamera();
          }
        }}
        onTogglePreview={() => setShowWebcamPreview((v) => !v)}
        onToggleLandmarks={() => setShowLandmarks((v) => !v)}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Drawing Workspace */}
      <main className="relative flex-1 w-full h-[calc(100vh-6.5rem)] overflow-hidden">
        {/* Error notification banner if camera fails */}
        {trackingState.errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90%] bg-rose-950/90 border border-rose-800/80 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs text-rose-200 backdrop-blur-md animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{trackingState.errorMessage}</span>
            </div>
            <button
              onClick={retry}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shrink-0 flex items-center gap-1.5 transition-colors shadow-md shadow-rose-600/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* The Digital Canvas Layer */}
        <DrawingCanvas
          tool={activeTool}
          color={color}
          brushSize={brushSize}
          bgColor={bgColor}
          strokes={strokes}
          onCommitStroke={handleCommitStroke}
          cursorPosition={trackingState.cursorPosition}
          gesture={trackingState.gesture}
          handDetected={trackingState.handDetected}
          cameraActive={trackingState.cameraActive}
          onStartCamera={startCamera}
        />

        {/* Floating Left Toolbar */}
        <Toolbar
          activeTool={activeTool}
          color={color}
          brushSize={brushSize}
          bgColor={bgColor}
          canUndo={strokes.length > 0}
          canRedo={redoStack.length > 0}
          onSelectTool={setActiveTool}
          onSelectColor={setColor}
          onChangeBrushSize={setBrushSize}
          onChangeBgColor={setBgColor}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={() => setIsClearModalOpen(true)}
          onExportPNG={handleExportPNG}
        />

        {/* Floating Camera Preview PIP */}
        {showWebcamPreview && (
          <CameraPreview
            videoRef={videoRef}
            cameraActive={trackingState.cameraActive}
            cameraStatus={trackingState.cameraStatus}
            handDetected={trackingState.handDetected}
            gesture={trackingState.gesture}
            landmarks={trackingState.landmarks}
            showLandmarks={showLandmarks}
            fps={trackingState.fps}
            onStartCamera={startCamera}
          />
        )}
      </main>

      {/* Bottom Status Bar */}
      <StatusIndicator
        tool={activeTool}
        color={color}
        brushSize={brushSize}
        cameraActive={trackingState.cameraActive}
        cameraStatus={trackingState.cameraStatus}
        handDetected={trackingState.handDetected}
        gesture={trackingState.gesture}
        fps={trackingState.fps}
      />

      {/* Modals */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Clear Virtual Canvas?"
        message="This action will delete all existing drawing strokes on the canvas. Unsaved artwork will be lost."
        confirmLabel="Clear Canvas"
        cancelLabel="Keep Drawing"
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
      />

      <GestureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}

export default App;
