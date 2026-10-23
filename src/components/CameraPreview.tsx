import React, { useRef, useEffect, useState } from 'react';
import type {
  HandLandmark,
  GestureType,
  CameraStatus,
} from '../types';
import { HAND_CONNECTIONS } from '../utils/gestureUtils';
import { Minimize2, Maximize2, ShieldCheck, Video, Zap } from 'lucide-react';

interface CameraPreviewProps {
  stream: MediaStream | null;
  cameraActive: boolean;
  cameraStatus: CameraStatus;
  handDetected: boolean;
  gesture: GestureType;
  landmarks: HandLandmark[] | null;
  showLandmarks: boolean;
  fps: number;
  onStartCamera: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  stream,
  cameraActive,
  handDetected,
  gesture,
  landmarks,
  showLandmarks,
  fps,
  onStartCamera,
}) => {
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Synchronize stream with preview video element whenever stream, cameraActive, or isMinimized changes
  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video) return;

    if (cameraActive && stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.play().catch((err) => {
        console.warn('Camera preview video play interrupted:', err);
      });
    } else {
      video.srcObject = null;
    }
  }, [stream, cameraActive, isMinimized]);

  // Render hand landmark skeleton onto overlay canvas
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!cameraActive || !landmarks || landmarks.length < 21 || !showLandmarks) {
      return;
    }

    const w = canvas.width;
    const h = canvas.height;

    // Draw skeleton bone connections
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      // Video preview and canvas are both mirrored with CSS `scaleX(-1)`.
      const x1 = p1.x * w;
      const y1 = p1.y * h;
      const x2 = p2.x * w;
      const y2 = p2.y * h;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, '#8B5CF6'); // Violet
      grad.addColorStop(1, '#06B6D4'); // Cyan

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw landmark joint points
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const x = pt.x * w;
      const y = pt.y * h;

      ctx.beginPath();
      if (i === 8) {
        // Highlight Index Fingertip with distinct glowing rings
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle =
          gesture === 'erase'
            ? '#F43F5E'
            : gesture === 'draw'
            ? '#22D3EE'
            : '#F59E0B';
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.strokeStyle =
          gesture === 'erase'
            ? 'rgba(244,63,94,0.8)'
            : gesture === 'draw'
            ? 'rgba(34,211,238,0.7)'
            : 'rgba(245,158,11,0.7)';
        ctx.stroke();
      } else {
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#0F172A';
        ctx.stroke();
      }
    }
  }, [cameraActive, landmarks, showLandmarks, gesture]);

  if (!cameraActive) {
    return (
      <div className="fixed right-6 top-20 z-20 w-64 bg-[#0d1424]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-950/60 border border-violet-800/40 flex items-center justify-center mx-auto mb-3">
          <Video className="w-6 h-6 text-violet-400" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Webcam Inactive</h3>
        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
          Enable webcam tracking to draw directly in mid-air using your index finger.
        </p>
        <button
          onClick={onStartCamera}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          Start Air Tracking
        </button>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local processing only. No video uploaded.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed right-6 top-20 z-20 bg-[#0c121e]/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-52' : 'w-72 sm:w-80'
      }`}
    >
      {/* Window Header */}
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">Vision Feed</span>
          <span className="text-[10px] font-mono text-slate-400">{fps} FPS</span>
        </div>

        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={isMinimized ? 'Expand preview' : 'Minimize preview'}
        >
          {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isMinimized && (
        <div className="relative aspect-[4/3] bg-black overflow-hidden">
          {/* Mirrored webcam video */}
          <video
            ref={previewVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Mirrored Landmark skeleton canvas */}
          <canvas
            ref={overlayCanvasRef}
            width={320}
            height={240}
            className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
          />

          {/* Real-time Gesture State Pill */}
          <div className="absolute top-2.5 left-2.5 z-10">
            {handDetected ? (
              <div
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-lg backdrop-blur-md border ${
                  gesture === 'erase'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/50 shadow-rose-500/20'
                    : gesture === 'draw'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20'
                    : gesture === 'hover'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700'
                }`}
              >
                {gesture === 'erase'
                  ? '🧹 Erasing'
                  : gesture === 'draw'
                  ? '✍️ Drawing'
                  : gesture === 'hover'
                  ? '👆 Hover / Move'
                  : '✋ Inactive'}
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-900/80 text-slate-400 border border-slate-800 backdrop-blur-md">
                Looking for hand...
              </div>
            )}
          </div>

          {/* Privacy badge */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[9px] text-slate-400 flex items-center gap-1 backdrop-blur-sm pointer-events-none">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            100% On-Device
          </div>
        </div>
      )}
    </div>
  );
};
