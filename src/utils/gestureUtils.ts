import type { HandLandmark, GestureType, Point } from '../types';

export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [9, 10], [10, 11], [11, 12], [0, 9],
  // Ring finger
  [13, 14], [14, 15], [15, 16], [0, 13],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17]
];

/**
 * Euclidean distance between two 2D points.
 */
export function distance2D(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a finger is extended based on landmarks.
 * Uses both orientation-aligned projection and Euclidean distance from wrist.
 */
export function isFingerExtended(
  landmarks: HandLandmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number
): boolean {
  const wrist = landmarks[0];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  // Hand axis vector from wrist to middle MCP (landmark 9)
  const middleMcp = landmarks[9];
  const axisX = middleMcp.x - wrist.x;
  const axisY = middleMcp.y - wrist.y;
  const axisLen = Math.hypot(axisX, axisY) || 1e-6;
  const normAxisX = axisX / axisLen;
  const normAxisY = axisY / axisLen;

  // Project tip and pip onto hand axis
  const tipProj = (tip.x - wrist.x) * normAxisX + (tip.y - wrist.y) * normAxisY;
  const pipProj = (pip.x - wrist.x) * normAxisX + (pip.y - wrist.y) * normAxisY;
  const mcpProj = (mcp.x - wrist.x) * normAxisX + (mcp.y - wrist.y) * normAxisY;

  // Euclidean distances
  const distTipWrist = distance2D(tip, wrist);
  const distPipWrist = distance2D(pip, wrist);

  // A finger is extended if tip is beyond PIP along hand axis and farther from wrist
  const axisCheck = tipProj > pipProj * 1.08 && tipProj > mcpProj * 1.15;
  const distCheck = distTipWrist > distPipWrist * 1.15;

  // Screen Y fallback for standard upright poses (Y is 0 at top)
  const screenYCheck = tip.y < pip.y;

  return (axisCheck && distCheck) || (distCheck && screenYCheck);
}

/**
 * Geometric Rule-Based Gesture Classification:
 * - DRAW: Index extended, Middle folded (1 finger up)
 * - HOVER / MOVE: Index extended AND Middle extended, ring/pinky folded (2 fingers up - peace sign)
 * - ERASE: Open Palm / 3+ fingers extended (wiping gesture)
 * - STOP / INACTIVE: Index folded, fist, or other poses
 */
export function classifyGesture(landmarks: HandLandmark[]): {
  gesture: GestureType;
  indexExtended: boolean;
  middleExtended: boolean;
  ringExtended: boolean;
  pinkyExtended: boolean;
} {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'none',
      indexExtended: false,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
    };
  }

  // Index: tip 8, pip 6, mcp 5
  const indexExtended = isFingerExtended(landmarks, 8, 6, 5);
  // Middle: tip 12, pip 10, mcp 9
  const middleExtended = isFingerExtended(landmarks, 12, 10, 9);
  // Ring: tip 16, pip 14, mcp 13
  const ringExtended = isFingerExtended(landmarks, 16, 14, 13);
  // Pinky: tip 20, pip 18, mcp 17
  const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17);

  // Erase rule: Open hand / palm (index + middle + ring/pinky extended)
  if (indexExtended && middleExtended && (ringExtended || pinkyExtended)) {
    return {
      gesture: 'erase',
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended,
    };
  }

  // Draw rule: Index is exclusively extended, middle is folded
  if (indexExtended && !middleExtended) {
    return {
      gesture: 'draw',
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended,
    };
  }

  // Hover rule: Index and middle fingers extended together (peace / two-finger pointer)
  if (indexExtended && middleExtended) {
    return {
      gesture: 'hover',
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended,
    };
  }

  // Otherwise stop
  return {
    gesture: 'stop',
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
  };
}

/**
 * Debounce filter for gesture recognition across frames to prevent flicker.
 */
export class GestureStabilizer {
  private history: GestureType[] = [];
  private readonly bufferSize: number;
  private currentStableGesture: GestureType = 'none';

  constructor(bufferSize = 3) {
    this.bufferSize = bufferSize;
  }

  update(rawGesture: GestureType): GestureType {
    this.history.push(rawGesture);
    if (this.history.length > this.bufferSize) {
      this.history.shift();
    }

    // Check if all recent frames agree
    if (this.history.length === this.bufferSize) {
      const allMatch = this.history.every((g) => g === rawGesture);
      if (allMatch) {
        this.currentStableGesture = rawGesture;
      }
    } else {
      this.currentStableGesture = rawGesture;
    }

    return this.currentStableGesture;
  }

  reset(): void {
    this.history = [];
    this.currentStableGesture = 'none';
  }
}

/**
 * Adaptive Exponential Moving Average position filter for cursor smoothing.
 * Dynamically adjusts alpha based on movement speed:
 * - High speed -> high alpha (fast response, low latency)
 * - Low speed -> low alpha (heavy smoothing, removes jitter)
 */
export class CursorSmoother {
  private smoothedPoint: Point | null = null;
  private minAlpha: number;
  private maxAlpha: number;

  constructor(minAlpha = 0.22, maxAlpha = 0.75) {
    this.minAlpha = minAlpha;
    this.maxAlpha = maxAlpha;
  }

  smooth(rawPoint: Point): Point {
    if (!this.smoothedPoint) {
      this.smoothedPoint = { ...rawPoint };
      return this.smoothedPoint;
    }

    const dist = distance2D(rawPoint, this.smoothedPoint);
    // Speed-based adaptive alpha
    const speedFactor = Math.min(dist / 35, 1);
    const alpha = this.minAlpha + (this.maxAlpha - this.minAlpha) * speedFactor;

    this.smoothedPoint = {
      x: this.smoothedPoint.x + alpha * (rawPoint.x - this.smoothedPoint.x),
      y: this.smoothedPoint.y + alpha * (rawPoint.y - this.smoothedPoint.y),
    };

    return { ...this.smoothedPoint };
  }

  reset(): void {
    this.smoothedPoint = null;
  }

  getCurrent(): Point | null {
    return this.smoothedPoint ? { ...this.smoothedPoint } : null;
  }
}
