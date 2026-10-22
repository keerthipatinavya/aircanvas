# AirCanvas — Draw in the Air. Create on Screen.

> **Academic Title:** Real-Time Hand Gesture Recognition and Virtual Drawing Using Computer Vision  
> **Repository:** `aircanvas`  
> **Deployment Target:** Vercel (Production Ready)

---

## 1. Overview

**AirCanvas** is a modern, high-performance browser application that empowers users to paint and sketch in mid-air using their laptop or desktop webcam. Built entirely in client-side software using **MediaPipe Tasks Vision**, **React 19**, **TypeScript**, **Tailwind CSS**, and the **HTML5 Canvas API**, AirCanvas eliminates the need for expensive motion capture hardware, colored finger caps, microcontrollers, or server-side inference pipelines.

All computer vision inference and geometric gesture classification occur **100% locally on your device** via WebAssembly (WASM) and WebGL.

---

## 2. Key Features

- **Real-Time Hand Tracking:** Detects 21 3D hand landmarks at up to 60 FPS using MediaPipe's Hand Landmarker in video stream mode.
- **Rule-Based Geometric Gesture Interpretation:**
  - **Draw Mode (☝️):** Index finger extended while middle, ring, and pinky fingers are folded.
  - **Hover / Move Mode (✌️):** Index and middle fingers extended together (moves the targeting reticle without leaving marks).
  - **Stop / Lift Pen (✊):** Lowering the index finger or curling into a fist lifts the virtual brush cleanly without accidental connector strokes.
- **Jitter Reduction & Smoothing:**
  - Dynamic **Adaptive Exponential Moving Average (EMA)** filter adjusts smoothing based on movement velocity: high smoothing when holding still or drawing fine curves, instant responsiveness during fast strokes.
  - **Multi-Frame Gesture Stabilizer** prevents erratic stroke initiation during hand transitions.
- **Full Creative Toolbar:**
  - **Drawing Modes:** Freehand Pen and Eraser (`destination-out` blending).
  - **Shape Tools:** Straight Line, Rectangle, and Circle/Ellipse (with live interactive preview).
  - **Brush Sizing:** 2px to 48px brush thickness with dynamic size preview.
  - **Color Palette:** 9 vibrant curated colors + custom hex color picker.
  - **Canvas Themes:** Deep Space (`#090d16`), Dark Navy (`#0f172a`), Pure Black (`#000000`), and Studio White (`#ffffff`).
  - **Canvas History:** Comprehensive Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) stroke history.
  - **High-Res PNG Export:** Single-click export capturing pristine artwork at 2x Retina resolution with custom background, excluding UI and video overlays.
  - **Clear Canvas Modal:** Safeguards artwork against accidental erasure.
- **Floating Camera Preview:**
  - Mirrored webcam feed (`scaleX(-1)`) so natural rightward motion moves right on screen.
  - Real-time landmark skeleton overlay showing bone connections and fingertip tracker.
  - Real-time gesture state badge and FPS monitor.
  - Minimizable and hideable PIP window.
- **Universal Mouse & Touch Fallback:**
  - Fully functional without a webcam! Open the app on desktop, tablet, or smartphone to draw with a mouse, trackpad, or touchscreen.
  - Camera access is requested **only** when explicitly clicking "Start Camera".
- **Keyboard Shortcuts:**
  - `P`: Pen Tool
  - `E`: Eraser Tool
  - `L`: Straight Line Tool
  - `R`: Rectangle Tool
  - `C`: Circle Tool
  - `Ctrl+Z` / `Cmd+Z`: Undo
  - `Ctrl+Y` / `Cmd+Shift+Z`: Redo

---

## 3. Technology Stack

- **Framework & Runtime:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (Modern dark graphite / deep navy palette with violet and cyan accents)
- **Computer Vision:** `@mediapipe/tasks-vision` (MediaPipe Tasks Vision Hand Landmarker)
- **Rendering:** HTML5 Canvas 2D Context with Device Pixel Ratio (DPR) Retina scaling
- **Icons:** `lucide-react`
- **Hosting Target:** Vercel

---

## 4. How the Computer Vision & Gestures Work

### 4.1 Hand Landmark Regression
MediaPipe evaluates video frames provided by the browser's `navigator.mediaDevices.getUserMedia` API. The model outputs 21 three-dimensional normalized landmarks:
- **Landmark 0:** Wrist
- **Landmarks 5–8:** Index finger (MCP, PIP, DIP, TIP)
- **Landmarks 9–12:** Middle finger (MCP, PIP, DIP, TIP)
- **Landmarks 13–16:** Ring finger
- **Landmarks 17–20:** Pinky finger

### 4.2 Geometric Gesture Rules
Rather than training a black-box classification layer, AirCanvas utilizes **deterministic geometry**:
1. An orientation vector $\vec{v}_{\text{hand}}$ is constructed from Wrist (0) to Middle MCP (9), defining the directional axis of the palm.
2. For each finger, the tip and proximal interphalangeal (PIP) joints are projected onto $\vec{v}_{\text{hand}}$ alongside Euclidean distance checks:
   $$\text{Extended}(\text{finger}) \iff \text{dist}(\text{tip}, \text{wrist}) > 1.15 \times \text{dist}(\text{PIP}, \text{wrist}) \land \text{proj}(\text{tip}) > 1.08 \times \text{proj}(\text{PIP})$$
3. **Classification:**
   - $\text{Index Extended} \land \neg\text{Middle Extended} \implies \textbf{Draw}$
   - $\text{Index Extended} \land \text{Middle Extended} \implies \textbf{Hover / Move}$
   - $\neg\text{Index Extended} \implies \textbf{Stop}$

### 4.3 Coordinate Transformation & Mirroring
Webcams are mirrored horizontally so that user movements match natural mirror intuition:
$$X_{\text{canvas}} = (1 - X_{\text{normalized}}) \times W_{\text{canvas}}$$
$$Y_{\text{canvas}} = Y_{\text{normalized}} \times H_{\text{canvas}}$$

---

## 5. Local Installation & Development

### Prerequisites
- Node.js 18+ or 20+ (tested on v22.18)
- Modern web browser (Chrome, Edge, Safari, Firefox) with WebGL and webcam support

### Quickstart

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/aircanvas.git
   cd aircanvas
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

4. **Verify TypeScript & Production Build:**
   ```bash
   npm run build
   ```

5. **Preview Production Build:**
   ```bash
   npm run preview
   ```

---

## 6. Privacy & Security Architecture

- **No Remote Streaming:** Video frames from `getUserMedia` are fed directly to the browser WebAssembly memory space.
- **Zero Cloud Recording:** No frames, strokes, or biometric points are ever uploaded to any server.
- **Explicit Permission Model:** Camera permissions are requested **strictly upon user click** of the "Start Camera" button.
- **Clean Resource Teardown:** Whenever the camera is stopped or the tab is navigated away, all `MediaStreamTrack` instances are immediately halted (`track.stop()`) and animation frame loops are cancelled.

---

## 7. Known Limitations

- **Lighting Sensitivity:** In very dim environments or harsh backlighting (e.g. sitting with an open window directly behind your back), landmark accuracy may degrade. Frontal, uniform lighting yields the best results.
- **Two-Hand Disambiguation:** AirCanvas tracks the primary detected hand for virtual drawing. Two-handed simultaneous dual drawing is not enabled in this release to maximize single-hand tracking stability.
- **Extreme Camera Angles:** Hand poses severely tilted towards or away from the camera lens may compress landmark distances. Maintain a standard 1.5–3 ft frontal distance for optimal performance.

---

## 8. Deployment to Vercel

AirCanvas is fully configured for zero-configuration deployment to Vercel:

### Method A: Deploy via Vercel Web Dashboard
1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/aircanvas.git
   git branch -M main
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import the `aircanvas` repository.
4. Framework Preset: **Vite** (auto-detected).
5. Build Command: `npm run build` (or `tsc -b && vite build`).
6. Output Directory: `dist`.
7. Click **Deploy**.

### Method B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```
Follow the interactive prompts to deploy directly.

---

## 9. Academic Reference

If using AirCanvas for academic coursework, research demonstrations, or computer vision benchmarks, please cite:

```text
Title: Real-Time Hand Gesture Recognition and Virtual Drawing Using Computer Vision
Application: AirCanvas
Engine: MediaPipe Tasks Vision (Single-Hand 21-Landmark Topology)
Frontend Architecture: React, TypeScript, Vite, Tailwind CSS, HTML5 Canvas API
```

---

## 10. License

MIT License. Created for interactive computer vision and creative expression.
