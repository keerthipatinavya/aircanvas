import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type {
  HandTrackingState,
  HandLandmark,
  Point,
  GestureType,
} from '../types';
import {
  classifyGesture,
  GestureStabilizer,
  CursorSmoother,
} from '../utils/gestureUtils';

export interface UseHandTrackingOptions {
  canvasWidth: number;
  canvasHeight: number;
  smoothingAlpha?: number;
}

export function useHandTracking({
  canvasWidth,
  canvasHeight,
}: UseHandTrackingOptions) {
  const [state, setState] = useState<HandTrackingState>({
    cameraActive: false,
    cameraStatus: 'idle',
    modelStatus: 'idle',
    errorMessage: null,
    handDetected: false,
    gesture: 'none',
    cursorPosition: null,
    rawCursorPosition: null,
    normalizedCursorPosition: null,
    confidence: 0,
    landmarks: null,
    fps: 0,
  });

  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastTimestampRef = useRef<number>(0);

  // FPS calculation refs
  const frameCountRef = useRef<number>(0);
  const lastFpsTimestampRef = useRef<number>(0);

  // Stabilizer and Smoother instances
  const stabilizerRef = useRef(new GestureStabilizer(3));
  const smootherRef = useRef(new CursorSmoother(0.2, 0.75));

  // Canvas dimensions in refs for access inside RAF loop
  const dimsRef = useRef({ width: canvasWidth, height: canvasHeight });
  useEffect(() => {
    dimsRef.current = { width: canvasWidth, height: canvasHeight };
  }, [canvasWidth, canvasHeight]);

  /**
   * Initialize MediaPipe HandLandmarker model.
   * Tries local assets first, falls back gracefully to CDN.
   */
  const initializeLandmarker = useCallback(async (): Promise<HandLandmarker> => {
    if (landmarkerRef.current) {
      return landmarkerRef.current;
    }

    setState((s) => ({ ...s, modelStatus: 'loading', errorMessage: null }));

    // Try resolving vision wasm from local then CDN
    const wasmCandidatePaths = [
      `${window.location.origin}/wasm`,
      '/wasm',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm',
    ];

    let vision = null;
    let wasmErr: unknown = null;

    for (const wasmPath of wasmCandidatePaths) {
      try {
        vision = await FilesetResolver.forVisionTasks(wasmPath);
        if (vision) break;
      } catch (err) {
        wasmErr = err;
        console.warn(`Failed resolving WASM from ${wasmPath}, trying next...`, err);
      }
    }

    if (!vision) {
      const errMsg = 'Failed to load MediaPipe WASM runtime from local and CDN sources.';
      setState((s) => ({ ...s, modelStatus: 'error', errorMessage: errMsg }));
      throw wasmErr || new Error(errMsg);
    }

    // Try model options: Local GPU -> Local CPU -> Remote GPU -> Remote CPU
    const modelCandidates = [
      { path: `${window.location.origin}/models/hand_landmarker.task`, delegate: 'GPU' as const },
      { path: `${window.location.origin}/models/hand_landmarker.task`, delegate: 'CPU' as const },
      {
        path: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU' as const,
      },
      {
        path: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'CPU' as const,
      },
    ];

    let landmarker: HandLandmarker | null = null;
    let modelErr: unknown = null;

    for (const candidate of modelCandidates) {
      try {
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: candidate.path,
            delegate: candidate.delegate,
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (landmarker) {
          break;
        }
      } catch (err) {
        modelErr = err;
        console.warn(`Failed loading model (${candidate.path}, delegate ${candidate.delegate}):`, err);
      }
    }

    if (!landmarker) {
      const errMsg = 'Failed to load HandLandmarker model file.';
      setState((s) => ({ ...s, modelStatus: 'error', errorMessage: errMsg }));
      throw modelErr || new Error(errMsg);
    }

    landmarkerRef.current = landmarker;
    setState((s) => ({ ...s, modelStatus: 'ready' }));
    return landmarker;
  }, []);

  /**
   * Main tracking loop running on requestAnimationFrame
   */
  const startTrackingLoop = useCallback(() => {
    const loop = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;

          // Ensure monotonic timestamp for MediaPipe
          let timestamp = performance.now();
          if (timestamp <= lastTimestampRef.current) {
            timestamp = lastTimestampRef.current + 1;
          }
          lastTimestampRef.current = timestamp;

          // Calculate FPS
          if (lastFpsTimestampRef.current === 0) {
            lastFpsTimestampRef.current = timestamp;
          }
          frameCountRef.current++;
          if (timestamp - lastFpsTimestampRef.current >= 1000) {
            const currentFps = Math.round(
              (frameCountRef.current * 1000) / (timestamp - lastFpsTimestampRef.current)
            );
            frameCountRef.current = 0;
            lastFpsTimestampRef.current = timestamp;
            setState((s) => ({ ...s, fps: currentFps }));
          }

          try {
            const detection = landmarker.detectForVideo(video, timestamp);

            if (detection.landmarks && detection.landmarks.length > 0) {
              const rawLandmarks = detection.landmarks[0] as HandLandmark[];
              const gestureInfo = classifyGesture(rawLandmarks);
              const stableGesture: GestureType = stabilizerRef.current.update(
                gestureInfo.gesture
              );

              // Landmark 8 is the index finger tip
              const indexTip = rawLandmarks[8];

              // In mirrored webcam view, the X-coordinate is flipped horizontally
              const mirroredNormX = 1 - indexTip.x;
              const rawX = mirroredNormX * dimsRef.current.width;
              const rawY = indexTip.y * dimsRef.current.height;

              const rawPos: Point = { x: rawX, y: rawY };
              const smoothedPos = smootherRef.current.smooth(rawPos);

              const normW = dimsRef.current.width || window.innerWidth || 1;
              const normH = dimsRef.current.height || window.innerHeight || 1;
              const smoothedNormPos: Point = {
                x: Math.max(0, Math.min(1, smoothedPos.x / normW)),
                y: Math.max(0, Math.min(1, smoothedPos.y / normH)),
              };

              setState((s) => ({
                ...s,
                handDetected: true,
                gesture: stableGesture,
                cursorPosition: smoothedPos,
                rawCursorPosition: rawPos,
                normalizedCursorPosition: smoothedNormPos,
                landmarks: rawLandmarks,
                confidence: 0.9,
              }));
            } else {
              // No hand detected in this frame
              stabilizerRef.current.reset();
              smootherRef.current.reset();
              setState((s) => ({
                ...s,
                handDetected: false,
                gesture: 'none',
                cursorPosition: null,
                rawCursorPosition: null,
                normalizedCursorPosition: null,
                landmarks: null,
                confidence: 0,
              }));
            }
          } catch (detErr) {
            console.error('Detection error in frame:', detErr);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    animFrameIdRef.current = requestAnimationFrame(loop);
  }, []);

  /**
   * Stop camera tracks and tracking loop
   */
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    stabilizerRef.current.reset();
    smootherRef.current.reset();

    setState((s) => ({
      ...s,
      cameraActive: false,
      cameraStatus: 'stopped',
      handDetected: false,
      gesture: 'none',
      cursorPosition: null,
      rawCursorPosition: null,
      normalizedCursorPosition: null,
      landmarks: null,
      fps: 0,
    }));
  }, []);

  /**
   * Start camera and initialize tracking
   */
  const startCamera = useCallback(async () => {
    stopCamera();

    setState((s) => ({
      ...s,
      cameraStatus: 'requesting',
      errorMessage: null,
    }));

    try {
      // 1. Ensure Model is ready
      await initializeLandmarker();

      // 2. Request user media with ideal resolution
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support webcam media access.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      // 3. Connect stream to tracking video element
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.muted = true;
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(() => resolve()).catch(() => resolve());
          };
          if (video.readyState >= 1) {
            video.play().then(() => resolve()).catch(() => resolve());
          }
        });
      }

      setState((s) => ({
        ...s,
        cameraActive: true,
        cameraStatus: 'active',
        errorMessage: null,
      }));

      // 4. Begin RAF tracking loop
      startTrackingLoop();
    } catch (err: unknown) {
      console.error('Camera or model start failed:', err);
      let errorCategory: HandTrackingState['cameraStatus'] = 'error';
      let message = 'Failed to access camera.';

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorCategory = 'denied';
          message =
            'Camera permission was denied. Please allow camera access in your browser settings to use air drawing.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorCategory = 'not-found';
          message = 'No webcam was detected on your device.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Webcam is currently in use by another application.';
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setState((s) => ({
        ...s,
        cameraActive: false,
        cameraStatus: errorCategory,
        errorMessage: message,
      }));
    }
  }, [initializeLandmarker, startTrackingLoop, stopCamera]);

  // Synchronize stream with videoRef whenever stream changes or video element mounts
  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.muted = true;
        video.play().catch((err) => console.warn('Tracking video play error:', err));
      }
    }
  }, [stream]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {
          console.warn('Error closing landmarker:', e);
        }
        landmarkerRef.current = null;
      }
    };
  }, [stopCamera]);

  return {
    state,
    videoRef,
    stream,
    startCamera,
    stopCamera,
    retry: startCamera,
  };
}
