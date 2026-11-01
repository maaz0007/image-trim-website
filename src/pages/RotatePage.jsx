import React, { useState, useEffect, useRef } from 'react';
import UploadZone from '../components/UploadZone';
import FaqSection from '../components/FaqSection';
import { 
  readFile, loadImage, fmtBytes, getExt, downloadBlob 
} from '../utils/imageUtils';
import { useToast } from '../context/ToastContext';
import { 
  RotateCw, RotateCcw, Download, X, Sparkles, FlipHorizontal, FlipVertical, RefreshCw 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RotatePage() {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadedImg, setLoadedImg] = useState(null);

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState('image/jpeg');

  const canvasRef = useRef(null);

  const handleFilesSelected = async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      const src = await readFile(file);
      const img = await loadImage(src);
      setLoadedImg(img);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      showToast('Image loaded! Click buttons to rotate or flip.', 'success');
    } catch (err) {
      showToast('Failed to load image.', 'error');
    }
  };

  const handleRotate = (deg) => {
    setRotation((prev) => (prev + deg) % 360);
    showToast(`Rotated ${deg}°`, 'info');
  };

  const handleFlip = (direction) => {
    if (direction === 'h') setFlipH(!flipH);
    if (direction === 'v') setFlipV(!flipV);
    showToast(`Flipped ${direction === 'h' ? 'horizontally' : 'vertically'}!`, 'info');
  };

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    showToast('Orientation reset', 'info');
  };

  // Draw rotated canvas
  const renderRotated = (canvas, img) => {
    if (!canvas || !img) return;
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));

    const w = Math.round(img.width * cos + img.height * sin);
    const h = Math.round(img.width * sin + img.height * cos);

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.translate(w / 2, h / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  };

  useEffect(() => {
    if (!loadedImg || !canvasRef.current) return;
    renderRotated(canvasRef.current, loadedImg);
  }, [loadedImg, rotation, flipH, flipV, format]);

  const handleDownload = () => {
    if (!loadedImg) return;
    const workCanvas = document.createElement('canvas');
    renderRotated(workCanvas, loadedImg);

    workCanvas.toBlob((blob) => {
      if (blob) {
        const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'transformed';
        const ext = getExt(format);
        downloadBlob(blob, `${baseName}_rotated.${ext}`);
        confetti({ particleCount: 65, spread: 55, origin: { y: 0.8 } });
        showToast('Transformed image downloaded!', 'success');
      }
    }, format, 0.95);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setLoadedImg(null);
    showToast('Image removed', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] shadow-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#ff4f00]" /> Instant Geometric Alignment
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#201515] dark:text-[#fffefb] mb-3">
          Rotate &amp; <span className="text-[#ff4f00]">Flip Studio</span>
        </h1>
        <p className="text-sm sm:text-base text-[#605d52] dark:text-[#9f9b8f]">
          Rotate 90°, 180°, 270° or mirror flip your photos in milliseconds with 100% loss-free canvas precision.
        </p>
      </div>

      {!selectedFile ? (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          title="Drop image to rotate or flip"
          subtitle="Any image format supported (JPG, PNG, WebP, AVIF, TIFF, BMP)"
        />
      ) : (
        <div className="p-6 sm:p-8 rounded-lg sm:rounded-xl border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm animate-fade-up">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] flex-wrap gap-3">
            <h3 className="text-base sm:text-lg font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-[#ff4f00]" /> Transformation Controls
            </h3>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove Image
            </button>
          </div>

          {/* Transform Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <button
              onClick={() => handleRotate(90)}
              className="p-3.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00] hover:bg-[rgba(32,21,21,0.03)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs"
            >
              <RotateCw className="w-5 h-5 text-[#ff4f00]" />
              <span>90° Right</span>
            </button>

            <button
              onClick={() => handleRotate(180)}
              className="p-3.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00] hover:bg-[rgba(32,21,21,0.03)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs"
            >
              <RefreshCw className="w-5 h-5 text-[#ff4f00]" />
              <span>180° Invert</span>
            </button>

            <button
              onClick={() => handleRotate(270)}
              className="p-3.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00] hover:bg-[rgba(32,21,21,0.03)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs"
            >
              <RotateCcw className="w-5 h-5 text-[#ff4f00]" />
              <span>90° Left</span>
            </button>

            <button
              onClick={() => handleFlip('h')}
              className={`p-3.5 rounded-md border transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs ${
                flipH
                  ? 'border-[#201515] bg-[#201515] text-[#fffefb] dark:border-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515] shadow-sm'
                  : 'border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00]'
              }`}
            >
              <FlipHorizontal className={`w-5 h-5 ${flipH ? 'text-inherit' : 'text-[#ff4f00]'}`} />
              <span>Flip H</span>
            </button>

            <button
              onClick={() => handleFlip('v')}
              className={`p-3.5 rounded-md border transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs ${
                flipV
                  ? 'border-[#201515] bg-[#201515] text-[#fffefb] dark:border-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515] shadow-sm'
                  : 'border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00]'
              }`}
            >
              <FlipVertical className={`w-5 h-5 ${flipV ? 'text-inherit' : 'text-[#ff4f00]'}`} />
              <span>Flip V</span>
            </button>
          </div>

          {/* Format Control */}
          <div className="mb-6 max-w-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-2">
              Save As Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:ring-2 focus:ring-[#ff4f00]"
            >
              <option value="image/jpeg">JPG / JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WEBP</option>
            </select>
          </div>

          {/* Live Render Canvas */}
          <div className="mb-6 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.12)] bg-[#f8f4f0] dark:bg-[#0a0a0a] p-4 text-center overflow-hidden">
            <span className="text-xs font-bold text-[#605d52] dark:text-[#9f9b8f] uppercase tracking-wider block mb-3">
              Render Preview (Rotation: {rotation}°, FlipH: {flipH ? 'Yes' : 'No'}, FlipV: {flipV ? 'Yes' : 'No'})
            </span>
            <canvas
              ref={canvasRef}
              className="max-h-[380px] max-w-full mx-auto rounded-md object-contain border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] shadow-sm bg-white dark:bg-[#121212]"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleReset}
              className="px-5 py-3 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffefb] dark:bg-[#1a1a1a] text-xs font-bold text-[#201515] dark:text-[#fffefb] hover:bg-[rgba(32,21,21,0.04)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-all"
            >
              Reset Orientation
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#ff4f00] hover:bg-[#e04500] active:bg-[#c93e00] text-[#fffefb] font-bold text-sm shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            >
              <Download className="w-5 h-5" /> Download Transformed Image
            </button>
          </div>
        </div>
      )}

      <FaqSection />
    </div>
  );
}

