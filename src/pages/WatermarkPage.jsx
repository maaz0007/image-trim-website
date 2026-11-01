import React, { useState, useEffect, useRef } from 'react';
import UploadZone from '../components/UploadZone';
import FaqSection from '../components/FaqSection';
import { 
  readFile, loadImage, fmtBytes, downloadBlob 
} from '../utils/imageUtils';
import { useToast } from '../context/ToastContext';
import { Shield, Download, X, Sparkles, Type, Sliders } from 'lucide-react';
import confetti from 'canvas-confetti';

const POSITIONS = [
  { id: 'top-left', label: '↖' },
  { id: 'top-center', label: '↑' },
  { id: 'top-right', label: '↗' },
  { id: 'mid-left', label: '←' },
  { id: 'center', label: '●' },
  { id: 'mid-right', label: '→' },
  { id: 'bot-left', label: '↙' },
  { id: 'bot-center', label: '↓' },
  { id: 'bot-right', label: '↘' },
];

export default function WatermarkPage() {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadedImg, setLoadedImg] = useState(null);

  // Watermark parameters
  const [text, setText] = useState('© ImageTrim');
  const [fontSize, setFontSize] = useState(40);
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(60);
  const [style, setStyle] = useState('single'); // 'single' | 'tile'
  const [position, setPosition] = useState('bot-right');

  const canvasRef = useRef(null);

  const handleFilesSelected = async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      const src = await readFile(file);
      const img = await loadImage(src);
      setLoadedImg(img);
      showToast('Image loaded! Add your watermark.', 'success');
    } catch (err) {
      showToast('Failed to load image.', 'error');
    }
  };

  // Draw Watermark on Canvas
  const drawWatermark = (canvas, img, scale = 1) => {
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const actualFontSize = Math.round(fontSize * scale);
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.font = `bold ${actualFontSize}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';

    const cw = canvas.width;
    const ch = canvas.height;

    if (style === 'tile') {
      const tw = ctx.measureText(text).width + actualFontSize * 2;
      for (let y = actualFontSize; y < ch; y += actualFontSize * 3) {
        for (let x = 0; x < cw; x += tw) {
          ctx.fillText(text, x, y);
        }
      }
    } else {
      const tw = ctx.measureText(text).width;
      const pad = actualFontSize * 0.8;

      const posMap = {
        'top-left': [pad, pad + actualFontSize / 2],
        'top-center': [(cw - tw) / 2, pad + actualFontSize / 2],
        'top-right': [cw - tw - pad, pad + actualFontSize / 2],
        'mid-left': [pad, ch / 2],
        'center': [(cw - tw) / 2, ch / 2],
        'mid-right': [cw - tw - pad, ch / 2],
        'bot-left': [pad, ch - pad - actualFontSize / 2],
        'bot-center': [(cw - tw) / 2, ch - pad - actualFontSize / 2],
        'bot-right': [cw - tw - pad, ch - pad - actualFontSize / 2],
      };

      const [x, y] = posMap[position] || posMap['center'];
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  };

  // Update Preview Canvas
  useEffect(() => {
    if (!loadedImg || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const containerWidth = canvas.parentElement?.clientWidth || 700;
    const maxW = Math.min(containerWidth, loadedImg.width);
    const scale = maxW / loadedImg.width;

    canvas.width = Math.round(loadedImg.width * scale);
    canvas.height = Math.round(loadedImg.height * scale);

    drawWatermark(canvas, loadedImg, scale);
  }, [loadedImg, text, fontSize, color, opacity, style, position]);

  const handleDownload = () => {
    if (!loadedImg) return;
    const workCanvas = document.createElement('canvas');
    workCanvas.width = loadedImg.width;
    workCanvas.height = loadedImg.height;

    drawWatermark(workCanvas, loadedImg, 1.0);

    workCanvas.toBlob((blob) => {
      if (blob) {
        const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'watermarked';
        downloadBlob(blob, `${baseName}_watermarked.jpg`);
        confetti({ particleCount: 65, spread: 55, origin: { y: 0.8 } });
        showToast('Watermarked image downloaded!', 'success');
      }
    }, 'image/jpeg', 0.95);
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
          <Sparkles className="w-3.5 h-3.5 text-[#ff4f00]" /> Copyright & Branding
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#201515] dark:text-[#fffefb] mb-3">
          Watermark <span className="text-[#ff4f00]">Studio</span>
        </h1>
        <p className="text-sm sm:text-base text-[#605d52] dark:text-[#9f9b8f]">
          Protect photos and digital assets with custom text branding, opacity control, 9-point grid alignment, or full pattern tiling.
        </p>
      </div>

      {!selectedFile ? (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          title="Drop image for watermark"
          subtitle="Any image format supported (JPG, PNG, WebP, AVIF, TIFF, BMP)"
        />
      ) : (
        <div className="p-6 sm:p-8 rounded-lg sm:rounded-xl border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm animate-fade-up">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] flex-wrap gap-3">
            <h3 className="text-base sm:text-lg font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#ff4f00]" /> Watermark Configuration
            </h3>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove Image
            </button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-2">
                Watermark Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] text-sm font-medium outline-none focus:ring-2 focus:ring-[#ff4f00]"
                placeholder="Enter watermark string..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f]">
                  Font Size
                </label>
                <span className="text-xs font-bold text-[#ff4f00]">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-2 accent-[#ff4f00] bg-[rgba(32,21,21,0.1)] dark:bg-[rgba(255,255,255,0.1)] rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-2">
                  Color
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-14 h-10 rounded-md cursor-pointer border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-transparent p-1"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f]">
                    Opacity
                  </label>
                  <span className="text-xs font-bold text-[#ff4f00]">{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full h-2 accent-[#ff4f00] bg-[rgba(32,21,21,0.1)] dark:bg-[rgba(255,255,255,0.1)] rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-2">
                Display Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] text-sm font-medium outline-none focus:ring-2 focus:ring-[#ff4f00]"
              >
                <option value="single">Single Position</option>
                <option value="tile">Tiled Pattern (Repeated)</option>
              </select>
            </div>
          </div>

          {/* Position Selector Matrix */}
          {style === 'single' && (
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-2.5">
                Alignment Position
              </label>
              <div className="grid grid-cols-3 gap-2 w-44">
                {POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPosition(p.id)}
                    className={`h-11 rounded-md border font-bold text-sm transition-all flex items-center justify-center ${
                      position === p.id
                        ? 'bg-[#201515] text-[#fffefb] border-[#201515] dark:bg-[#fffefb] dark:text-[#201515] dark:border-[#fffefb] shadow-sm'
                        : 'border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] hover:bg-[rgba(32,21,21,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Canvas Preview */}
          <div className="mb-6 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.12)] bg-[#f8f4f0] dark:bg-[#0a0a0a] p-4 text-center overflow-hidden">
            <span className="text-xs font-bold text-[#605d52] dark:text-[#9f9b8f] uppercase tracking-wider block mb-3">
              Live Watermark Render
            </span>
            <canvas
              ref={canvasRef}
              className="max-h-[380px] max-w-full mx-auto rounded-md object-contain border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] shadow-sm bg-white dark:bg-[#121212]"
            />
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] active:bg-[#c93e00] text-[#fffefb] font-bold text-sm shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
          >
            <Download className="w-5 h-5" /> Download with Watermark
          </button>
        </div>
      )}

      <FaqSection />
    </div>
  );
}

