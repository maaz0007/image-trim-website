import { saveAs } from 'file-saver';

export const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
};

export const EXT_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function fmtBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

export function getExt(mime) {
  return EXT_MAP[mime] || 'jpg';
}

export function mimeLabel(mime) {
  if (!mime) return 'IMAGE';
  const labels = {
    'image/jpeg': 'JPG / JPEG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
    'image/avif': 'AVIF',
    'image/gif': 'GIF',
    'image/svg+xml': 'SVG',
    'application/pdf': 'PDF',
  };
  return labels[mime] || (mime.split('/')[1] ? mime.split('/')[1].toUpperCase() : mime.toUpperCase());
}

export function downloadBlob(blob, filename) {
  saveAs(blob, filename);
}

/**
 * Intelligent binary search & dimension stepping compressor
 */
export async function compressImageToTarget(img, fmt, targetBytes) {
  let scale = 1.0;
  let best = null;

  for (let s = 0; s < 14; s++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const ctx = canvas.getContext('2d');
    if (fmt === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (fmt === 'image/png') {
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      if (!best || blob.size <= targetBytes || blob.size < best.blob.size) {
        best = { canvas, blob };
      }
      if (blob.size <= targetBytes) break;
      scale *= 0.85;
      continue;
    }

    // Binary search quality for lossy formats (JPEG/WebP)
    let low = 0.05, high = 1.0, subBest = null;
    for (let i = 0; i < 7; i++) {
      const q = (low + high) / 2;
      const blob = await new Promise((res) => canvas.toBlob(res, fmt, q));
      if (!blob) break;

      if (!subBest || Math.abs(blob.size - targetBytes) < Math.abs(subBest.blob.size - targetBytes)) {
        subBest = { canvas, blob };
      }

      if (blob.size > targetBytes) {
        high = q;
      } else {
        low = q;
        if (targetBytes - blob.size < targetBytes * 0.06) break;
      }
    }

    if (subBest) {
      if (!best || subBest.blob.size <= targetBytes || subBest.blob.size < best.blob.size) {
        best = subBest;
      }
      if (subBest.blob.size <= targetBytes) break;
    }

    scale *= 0.82;
  }

  return best;
}

