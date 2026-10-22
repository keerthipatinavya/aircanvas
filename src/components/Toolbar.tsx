import React from 'react';
import {
  PenTool,
  Eraser,
  Slash,
  Square,
  Circle,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Palette,
} from 'lucide-react';
import type { DrawingTool } from '../types';

interface ToolbarProps {
  activeTool: DrawingTool;
  color: string;
  brushSize: number;
  bgColor: string;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (tool: DrawingTool) => void;
  onSelectColor: (color: string) => void;
  onChangeBrushSize: (size: number) => void;
  onChangeBgColor: (bg: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExportPNG: () => void;
}

const PRESET_COLORS = [
  { name: 'Electric Cyan', value: '#06B6D4' },
  { name: 'Neon Purple', value: '#8B5CF6' },
  { name: 'Vibrant Pink', value: '#EC4899' },
  { name: 'Bright Red', value: '#EF4444' },
  { name: 'Flame Orange', value: '#F97316' },
  { name: 'Sun Yellow', value: '#FACC15' },
  { name: 'Emerald Green', value: '#10B981' },
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Graphite Black', value: '#0F172A' },
];

const CANVAS_BG_OPTIONS = [
  { name: 'Deep Space', value: '#090d16' },
  { name: 'Dark Navy', value: '#0f172a' },
  { name: 'Pure Black', value: '#000000' },
  { name: 'Studio White', value: '#ffffff' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  color,
  brushSize,
  bgColor,
  canUndo,
  canRedo,
  onSelectTool,
  onSelectColor,
  onChangeBrushSize,
  onChangeBgColor,
  onUndo,
  onRedo,
  onClear,
  onExportPNG,
}) => {
  return (
    <aside
      className="fixed left-4 top-20 bottom-16 w-16 sm:w-64 max-h-[calc(100vh-9rem)] bg-[#0d1424]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-3 flex flex-col justify-between z-20 overflow-y-auto overflow-x-hidden transition-all duration-300"
      aria-label="Drawing Tools"
    >
      <div className="space-y-4">
        {/* Drawing Tools Section */}
        <div>
          <span className="hidden sm:block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Drawing Tools
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <button
              onClick={() => onSelectTool('pen')}
              id="tool-pen"
              className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-xs font-medium ${
                activeTool === 'pen'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Pen Tool (Freehand Drawing) [P]"
            >
              <PenTool className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Pen</span>
            </button>

            <button
              onClick={() => onSelectTool('eraser')}
              id="tool-eraser"
              className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-xs font-medium ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Eraser Tool [E]"
            >
              <Eraser className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>
        </div>

        {/* Shape Tools Section */}
        <div>
          <span className="hidden sm:block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Shapes (Mouse/Touch)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <button
              onClick={() => onSelectTool('line')}
              id="tool-line"
              className={`p-2 rounded-xl flex items-center justify-center transition-all text-xs font-medium ${
                activeTool === 'line'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Straight Line [L]"
            >
              <Slash className="w-4 h-4 shrink-0" />
              <span className="hidden sm:sr-only">Line</span>
            </button>

            <button
              onClick={() => onSelectTool('rect')}
              id="tool-rect"
              className={`p-2 rounded-xl flex items-center justify-center transition-all text-xs font-medium ${
                activeTool === 'rect'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Rectangle [R]"
            >
              <Square className="w-4 h-4 shrink-0" />
              <span className="hidden sm:sr-only">Rectangle</span>
            </button>

            <button
              onClick={() => onSelectTool('circle')}
              id="tool-circle"
              className={`p-2 rounded-xl flex items-center justify-center transition-all text-xs font-medium ${
                activeTool === 'circle'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Circle / Ellipse [C]"
            >
              <Circle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:sr-only">Circle</span>
            </button>
          </div>
        </div>

        {/* Brush Size Slider */}
        <div className="hidden sm:block">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Brush Size</span>
            <span className="text-violet-400 font-mono text-xs">{brushSize}px</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="2"
              max="48"
              step="1"
              value={brushSize}
              onChange={(e) => onChangeBrushSize(Number(e.target.value))}
              id="brush-size-slider"
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            {/* Visual preview dot */}
            <div
              className="rounded-full shrink-0 border border-slate-700 transition-all"
              style={{
                width: Math.min(Math.max(brushSize, 6), 24),
                height: Math.min(Math.max(brushSize, 6), 24),
                backgroundColor: activeTool === 'eraser' ? '#ffffff' : color,
              }}
            />
          </div>
        </div>

        {/* Color Palette */}
        {activeTool !== 'eraser' && (
          <div>
            <div className="hidden sm:flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>Palette</span>
              <label
                htmlFor="custom-color-picker"
                className="cursor-pointer text-slate-400 hover:text-violet-400 transition-colors"
                title="Pick custom color"
              >
                <Palette className="w-3.5 h-3.5" />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onSelectColor(c.value)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-transform ${
                    color.toLowerCase() === c.value.toLowerCase()
                      ? 'scale-110 ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-900 shadow-md'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
              {/* Custom Color Input */}
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
                <input
                  type="color"
                  id="custom-color-picker"
                  value={color}
                  onChange={(e) => onSelectColor(e.target.value)}
                  className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                  title="Pick custom HEX color"
                />
                <Palette className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Canvas Background Color Options */}
        <div className="hidden sm:block">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Canvas Background
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {CANVAS_BG_OPTIONS.map((bg) => (
              <button
                key={bg.value}
                onClick={() => onChangeBgColor(bg.value)}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-medium border text-center transition-all ${
                  bgColor === bg.value
                    ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
                title={`Set canvas background to ${bg.name}`}
              >
                {bg.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History and Export Actions */}
      <div className="space-y-2 pt-3 border-t border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            id="btn-undo"
            className="p-2 rounded-xl flex items-center justify-center gap-1.5 bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-medium"
            title="Undo Last Stroke (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            id="btn-redo"
            className="p-2 rounded-xl flex items-center justify-center gap-1.5 bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-medium"
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </button>
        </div>

        <button
          onClick={onClear}
          id="btn-clear-canvas"
          className="w-full p-2 rounded-xl flex items-center justify-center gap-1.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/40 text-rose-300 transition-all text-xs font-medium"
          title="Clear Entire Canvas"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Canvas</span>
        </button>

        <button
          onClick={onExportPNG}
          id="btn-export-png"
          className="w-full p-2.5 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition-all"
          title="Save Artwork as PNG Image"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export PNG</span>
        </button>
      </div>
    </aside>
  );
};
