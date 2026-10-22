import React from 'react';
import type {
  DrawingTool,
  GestureType,
  CameraStatus,
} from '../types';
import { Hand, MousePointer, Info } from 'lucide-react';

interface StatusIndicatorProps {
  tool: DrawingTool;
  color: string;
  brushSize: number;
  cameraActive: boolean;
  cameraStatus: CameraStatus;
  handDetected: boolean;
  gesture: GestureType;
  fps: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  tool,
  color,
  brushSize,
  cameraActive,
  handDetected,
  gesture,
  fps,
}) => {
  return (
    <footer className="fixed bottom-0 inset-x-0 h-10 px-4 md:px-6 bg-[#0a0f1d]/90 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between z-20 text-xs text-slate-400 select-none">
      {/* Tool & Brush state */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-300 capitalize">{tool}</span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-[11px] text-slate-400">{brushSize}px</span>
        </div>

        {tool !== 'eraser' && (
          <div
            className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
            style={{ backgroundColor: color }}
            title={`Active color: ${color}`}
          />
        )}
      </div>

      {/* Center Guidance Hint */}
      <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />
        {cameraActive ? (
          <span>
            <strong className="text-violet-300">Air Gesture:</strong> Index finger extended =
            Draw &bull; Index + Middle = Hover / Move cursor
          </span>
        ) : (
          <span>
            <strong className="text-cyan-300">Tip:</strong> Click & drag to draw with mouse or touch.
            Start camera to draw in the air!
          </span>
        )}
      </div>

      {/* Camera & Tracking Status */}
      <div className="flex items-center gap-3">
        {cameraActive ? (
          <div className="flex items-center gap-2">
            <Hand
              className={`w-3.5 h-3.5 ${
                handDetected ? 'text-emerald-400' : 'text-slate-500'
              }`}
            />
            <span className="text-[11px] font-medium text-slate-300">
              {handDetected
                ? gesture === 'draw'
                  ? '✍️ Drawing'
                  : gesture === 'hover'
                  ? '👆 Hovering'
                  : '✋ Inactive'
                : 'No Hand'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-[10px] text-slate-400">{fps} FPS</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mouse/Touch Active</span>
          </div>
        )}
      </div>
    </footer>
  );
};
