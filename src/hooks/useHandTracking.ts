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
    confidence: 0,
    landmarks: null,
    fps: 0,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

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
   * Tries local assets first, falls back to CDN.
   */
  const initializeLandmarker = useCallback(async (): Promise<HandLandmarker> => {
    if (landmarkerRef.current) {
      return landmarkerRef.current;
    }

    setState((s) => ({ ...s, modelStatus: 'loading', errorMessage: null }));

    let vision = null;
    try {
      // First attempt: local WASM assets
      vision = await FilesetResolver.forVisionTasks('/wasm');
    } catch (localWasmErr) {
      console.warn('Local WASM loading failed, falling back to CDN:', localWasmErr);
      // Fallback: CDN WASM assets
      vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm'
      );
    }

    let landmarker: HandLandmarker | null = null;

    try {
      // First attempt: local model
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (localModelErr) {
      console.warn('Local model loading failed, falling back to Cloud model:', localModelErr);
      try {
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (_cloudErr) {
        console.warn('Cloud model loading failed, falling back to CPU delegate:', _cloudErr);
        // Fallback without GPU delegate if WebGL is unavailable
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }
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
          const timestamp = performance.now();

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

              // In mirrored webcam view, the X-coordinate is flipped
              const mirroredNormX = 1 - indexTip.x;
              const rawX = mirroredNormX * dimsRef.current.width;
              const rawY = indexTip.y * dimsRef.current.height;

              const rawPos: Point = { x: rawX, y: rawY };
              const smoothedPos = smootherRef.current.smooth(rawPos);

              setState((s) => ({
                ...s,
                handDetected: true,
                gesture: stableGesture,
                cursorPosition: smoothedPos,
                rawCursorPosition: rawPos,
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      // 3. Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => resolve()).catch(() => resolve());
          };
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
    startCamera,
    stopCamera,
    retry: startCamera,
  };
}
