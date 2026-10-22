export type DrawingTool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  color: string;
  size: number;
  points: Point[];
  startPoint?: Point;
  endPoint?: Point;
}

export type GestureType = 'none' | 'draw' | 'hover' | 'stop';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'stopped'
  | 'denied'
  | 'not-found'
  | 'error';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandTrackingState {
  cameraActive: boolean;
  cameraStatus: CameraStatus;
  modelStatus: ModelStatus;
  errorMessage: string | null;
  handDetected: boolean;
  gesture: GestureType;
  cursorPosition: Point | null;
  rawCursorPosition: Point | null;
  confidence: number;
  landmarks: HandLandmark[] | null;
  fps: number;
}

export interface CanvasSettings {
  tool: DrawingTool;
  color: string;
  brushSize: number;
  bgColor: string;
  showWebcamPreview: boolean;
  showLandmarks: boolean;
  smoothingAlpha: number;
}
