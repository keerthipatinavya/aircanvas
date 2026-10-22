import React from 'react';
import { X, Cpu, Eye, Layers, ShieldCheck, Sparkles } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0c121e] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 shadow-lg shadow-violet-500/20">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-['Outfit']">AirCanvas</h2>
            <p className="text-xs text-slate-400">Draw in the Air. Create on Screen.</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-violet-950/20 border border-violet-800/30 mb-6">
          <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 block mb-1">
            Academic Project Title
          </span>
          <p className="text-sm font-semibold text-slate-100">
            Real-Time Hand Gesture Recognition and Virtual Drawing Using Computer Vision
          </p>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed mb-6">
          <div>
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              1. Landmark Detection & Tracking
            </h4>
            <p>
              MediaPipe Tasks Vision evaluates live video frames from the browser MediaDevices API
              using a machine-learning pipeline to detect single hands and regress 21 precise 3D hand
              keypoints. The index fingertip (landmark 8) serves as the primary drawing effector.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-violet-400" />
              2. Rule-Based Geometric Gesture Interpretation
            </h4>
            <p>
              Rather than an opaque classifier, hand gestures are evaluated through deterministic
              geometric relationships: comparing relative distances of finger tips and PIP joints
              projected along the palm coordinate axis. When the index finger is extended and the
              middle finger folded, drawing mode is activated. Extending both fingers triggers hover mode.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              3. Kinematic Smoothing & Stroke Continuity
            </h4>
            <p>
              An adaptive exponential moving average (EMA) filter dynamically scales its smoothing
              factor according to velocity, suppressing micro-tremors at rest while maintaining snappy
              responsiveness during brisk sweeps. Temporal hysteresis prevents erratic stroke breaks.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              4. Complete Edge Processing & Zero External Dependencies
            </h4>
            <p>
              All ML inference and canvas operations execute on-device inside WebAssembly and WebGL
              environments. No video data, coordinates, or imagery are transmitted to external servers.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
