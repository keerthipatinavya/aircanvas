import type { DrawingStroke } from '../types';

/**
 * Configure canvas for high-DPI displays.
 */
export function setupCanvasDPR(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): number {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Scale context to logical coordinates
  ctx.resetTransform();
  ctx.scale(dpr, dpr);
  return dpr;
}

/**
 * Draw a single stroke onto the provided context.
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  options?: { isPreview?: boolean }
): void {
  ctx.save();

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (options?.isPreview) {
      ctx.globalAlpha = 0.85;
    }
  }

  switch (stroke.tool) {
    case 'pen':
    case 'eraser': {
      const points = stroke.points;
      if (!points || points.length === 0) break;

      if (points.length === 1) {
        // Draw single dot
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      // Smooth path using midpoints and quadratic curves
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      // Final segment
      if (points.length > 1) {
        const lastIdx = points.length - 1;
        ctx.lineTo(points[lastIdx].x, points[lastIdx].y);
      }

      ctx.stroke();
      break;
    }

    case 'line': {
      const p1 = stroke.startPoint || stroke.points[0];
      const p2 = stroke.endPoint || stroke.points[stroke.points.length - 1];
      if (!p1 || !p2) break;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      break;
    }

    case 'rect': {
      const p1 = stroke.startPoint || stroke.points[0];
      const p2 = stroke.endPoint || stroke.points[stroke.points.length - 1];
      if (!p1 || !p2) break;

      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const w = Math.abs(p2.x - p1.x);
      const h = Math.abs(p2.y - p1.y);

      ctx.beginPath();
      ctx.strokeRect(x, y, w, h);
      break;
    }

    case 'circle': {
      const p1 = stroke.startPoint || stroke.points[0];
      const p2 = stroke.endPoint || stroke.points[stroke.points.length - 1];
      if (!p1 || !p2) break;

      const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

/**
 * Re-render the complete list of strokes onto a clean canvas.
 */
export function redrawCanvas(
  ctx: CanvasRenderingContext2D,
  strokes: DrawingStroke[],
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of strokes) {
    drawStroke(ctx, stroke);
  }
}

/**
 * Export canvas as PNG image file download.
 */
export function exportCanvasAsPNG(
  strokes: DrawingStroke[],
  width: number,
  height: number,
  bgColor: string = '#090d16',
  filenamePrefix: string = 'aircanvas-artwork'
): void {
  const exportCanvas = document.createElement('canvas');
  const dpr = Math.max(window.devicePixelRatio || 1, 2); // Export in sharp high-res
  exportCanvas.width = width * dpr;
  exportCanvas.height = height * dpr;

  const exportCtx = exportCanvas.getContext('2d');
  if (!exportCtx) return;

  exportCtx.scale(dpr, dpr);

  // Background fill
  if (bgColor !== 'transparent') {
    exportCtx.fillStyle = bgColor;
    exportCtx.fillRect(0, 0, width, height);
  }

  // Draw strokes
  for (const stroke of strokes) {
    drawStroke(exportCtx, stroke);
  }

  // Watermark or subtle branding
  exportCtx.save();
  exportCtx.font = '12px "Outfit", sans-serif';
  exportCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  exportCtx.textAlign = 'right';
  exportCtx.fillText('Created with AirCanvas', width - 20, height - 16);
  exportCtx.restore();

  const link = document.createElement('a');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.download = `${filenamePrefix}-${dateStr}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
