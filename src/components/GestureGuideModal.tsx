import React from 'react';
import {
  X,
  Sparkles,
  MousePointer,
  ShieldCheck,
  Lightbulb,
  CheckCircle2,
  Command,
} from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0c121e] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 shadow-lg shadow-violet-500/20">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-['Outfit']">
              AirCanvas Gesture Guide
            </h2>
            <p className="text-xs text-slate-400">
              Master virtual air drawing with geometric hand gestures
            </p>
          </div>
        </div>

        {/* Gesture Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {/* Card 1: Draw */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-violet-800/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-xl group-hover:bg-violet-600/20 transition-all pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">☝️</span>
              <div>
                <h4 className="text-sm font-semibold text-white">Draw Gesture</h4>
                <span className="text-[10px] font-mono text-violet-400 uppercase tracking-wider">
                  Active Inking
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Extend your <strong>index finger</strong> alone while keeping your middle finger folded.
              Move your fingertip to paint smooth strokes in real time.
            </p>
          </div>

          {/* Card 2: Hover / Navigate */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-800/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-full blur-xl group-hover:bg-amber-600/20 transition-all pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✌️</span>
              <div>
                <h4 className="text-sm font-semibold text-white">Hover / Navigate</h4>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                  Move Cursor Without Inking
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Extend both <strong>index and middle fingers</strong> together.
              The cursor moves freely without leaving any marks on the canvas.
            </p>
          </div>

          {/* Card 3: Stop / Inactive */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✊</span>
              <div>
                <h4 className="text-sm font-semibold text-white">Stop / Pause</h4>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Lift Pen
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Lower your index finger or close your hand into a gentle fist.
              The current stroke ends cleanly without stray connector lines.
            </p>
          </div>

          {/* Card 4: Mouse & Touch Fallback */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-800/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-600/10 rounded-full blur-xl group-hover:bg-cyan-600/20 transition-all pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <MousePointer className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-sm font-semibold text-white">Mouse & Touch Mode</h4>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Direct Drawing
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Click and drag to sketch with mouse or touch screen.
              Access shape tools (lines, rectangles, circles) with precision.
            </p>
          </div>
        </div>

        {/* Tips & Recommendations */}
        <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-900/40 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-violet-400 shrink-0" />
            <h4 className="text-xs font-semibold text-violet-200">
              Optimal Tracking Guidelines
            </h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 pl-6 list-disc">
            <li>Position yourself <strong>1.5 to 3 feet</strong> in front of your webcam.</li>
            <li>Maintain clear front lighting; avoid strong glare or backlighting behind you.</li>
            <li>Keep your hand within the webcam preview frame.</li>
            <li>If tracking pauses, simply bring your hand back into view.</li>
          </ul>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <Command className="w-3.5 h-3.5" />
            <span>Keyboard Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Pen</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">
                P
              </kbd>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Eraser</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">
                E
              </kbd>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Undo</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">
                Ctrl+Z
              </kbd>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Redo</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">
                Ctrl+Y
              </kbd>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>Privacy Note:</strong> All hand landmark tracking and video processing are executed
            entirely inside your browser using client-side WebAssembly and WebGL. Camera frames are
            never recorded, stored, or transmitted to any server.
          </p>
        </div>

        {/* Dismiss Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Got it, Let's Draw!
          </button>
        </div>
      </div>
    </div>
  );
};
