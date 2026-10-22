import React from 'react';
import {
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  HelpCircle,
  Sparkles,
  Layers,
  Activity,
  AlertCircle,
} from 'lucide-react';
import type { CameraStatus, ModelStatus } from '../types';

interface TopBarProps {
  cameraActive: boolean;
  cameraStatus: CameraStatus;
  modelStatus: ModelStatus;
  fps: number;
  showWebcamPreview: boolean;
  showLandmarks: boolean;
  isFullscreen: boolean;
  onToggleCamera: () => void;
  onTogglePreview: () => void;
  onToggleLandmarks: () => void;
  onToggleFullscreen: () => void;
  onOpenGuide: () => void;
  onOpenAbout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  cameraActive,
  cameraStatus,
  modelStatus,
  fps,
  showWebcamPreview,
  showLandmarks,
  isFullscreen,
  onToggleCamera,
  onTogglePreview,
  onToggleLandmarks,
  onToggleFullscreen,
  onOpenGuide,
  onOpenAbout,
}) => {
  return (
    <header className="h-16 px-4 md:px-6 bg-[#0c121e]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-30 select-none shadow-lg">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-violet-500 rounded-full border-2 border-[#0c121e] animate-pulse" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-['Outfit']">
              AirCanvas
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-violet-950/80 text-violet-300 border border-violet-800/40">
              v1.0 Vision
            </span>
          </div>
          <p className="hidden md:block text-xs text-slate-400 font-medium">
            Draw in the Air. Create on Screen.
          </p>
        </div>
      </div>

      {/* Center Camera & Tracking Quick Status */}
      <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/70 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              cameraActive
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : cameraStatus === 'denied' || cameraStatus === 'error'
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                : cameraStatus === 'requesting'
                ? 'bg-amber-400 animate-ping'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {cameraActive
              ? `Tracking Active (${fps} FPS)`
              : cameraStatus === 'requesting'
              ? 'Connecting Camera...'
              : cameraStatus === 'denied'
              ? 'Permission Denied'
              : cameraStatus === 'not-found'
              ? 'Camera Not Found'
              : 'Webcam Ready'}
          </span>
        </div>

        {modelStatus === 'loading' && (
          <span className="flex items-center gap-1 text-violet-400 text-[11px] border-l border-slate-800 pl-3">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            Loading Vision Engine...
          </span>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Main Camera Toggle Button */}
        <button
          onClick={onToggleCamera}
          id="btn-toggle-camera"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 shadow-md ${
            cameraActive
              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
              : cameraStatus === 'requesting'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/25 hover:shadow-violet-600/40'
          }`}
          title={cameraActive ? 'Stop webcam tracking' : 'Start webcam air drawing'}
        >
          {cameraActive ? (
            <>
              <CameraOff className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Stop Camera</span>
            </>
          ) : cameraStatus === 'requesting' ? (
            <>
              <Activity className="w-4 h-4 animate-spin text-amber-400" />
              <span>Starting...</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </>
          )}
        </button>

        {/* Toggle Webcam Preview */}
        {cameraActive && (
          <button
            onClick={onTogglePreview}
            id="btn-toggle-preview"
            className={`p-2 rounded-xl border transition-colors ${
              showWebcamPreview
                ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
            title={showWebcamPreview ? 'Hide camera preview window' : 'Show camera preview window'}
          >
            {showWebcamPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        )}

        {/* Toggle Landmarks Skeleton */}
        {cameraActive && (
          <button
            onClick={onToggleLandmarks}
            id="btn-toggle-landmarks"
            className={`p-2 rounded-xl border transition-colors ${
              showLandmarks
                ? 'bg-violet-950/40 border-violet-800/60 text-violet-300 hover:bg-violet-900/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
            title={showLandmarks ? 'Hide hand landmarks skeleton' : 'Show hand landmarks skeleton'}
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          id="btn-toggle-fullscreen"
          className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Gesture Guide Modal Button */}
        <button
          onClick={onOpenGuide}
          id="btn-open-guide"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-medium"
          title="Gesture Guide & Instructions"
        >
          <HelpCircle className="w-4 h-4 text-violet-400" />
          <span className="hidden md:inline">Gesture Guide</span>
        </button>

        {/* Project About Modal Button */}
        <button
          onClick={onOpenAbout}
          id="btn-open-about"
          className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs"
          title="Academic Information & Architecture"
        >
          <AlertCircle className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </header>
  );
};
