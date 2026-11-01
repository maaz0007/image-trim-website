import React, { useState } from 'react';
import UploadZone from '../components/UploadZone';
import CropTool from '../components/CropTool';
import FaqSection from '../components/FaqSection';
import { 
  readFile, loadImage, fmtBytes, getExt, mimeLabel, downloadBlob 
} from '../utils/imageUtils';
import { useToast } from '../context/ToastContext';
import { 
  Maximize2, Download, Eye, X, Lock, Unlock, Scissors 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const PRESETS = [
  { label: 'HD 720p', w: 1280, h: 720 },
  { label: 'Full HD', w: 1920, h: 1080 },
  { label: '4K Ultra', w: 3840, h: 2160 },
  { label: 'Insta Square', w: 1080, h: 1080 },
  { label: 'Insta Story', w: 1080, h: 1920 },
  { label: 'Facebook', w: 1200, h: 630 },
  { label: 'Twitter Banner', w: 1500, h: 500 },
  { label: '800 × 600', w: 800, h: 600 },
];

export default function ResizePage() {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalSrc, setOriginalSrc] = useState(null);
  const [loadedImg, setLoadedImg] = useState(null);

  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState('image/jpeg');

  const [previewSrc, setPreviewSrc] = useState(null);
  const [activeTab, setActiveTab] = useState('resize');

  const handleFilesSelected = async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      const src = await readFile(file);
      setOriginalSrc(src);
      const img = await loadImage(src);
      setLoadedImg(img);
      setOrigW(img.width);
      setOrigH(img.height);
      setWidth(img.width);
      setHeight(img.height);
      setPreviewSrc(null);
      showToast('Image loaded! Ready to resize or crop.', 'success');
    } catch (err) {
      showToast('Failed to load image file.', 'error');
    }
  };

  const handleWidthChange = (val) => {
    const w = parseInt(val) || 0;
    setWidth(w);
    if (lockAspect && origW > 0) {
      setHeight(Math.round((w * origH) / origW));
    }
  };

  const handleHeightChange = (val) => {
    const h = parseInt(val) || 0;
    setHeight(h);
    if (lockAspect && origH > 0) {
      setWidth(Math.round((h * origW) / origH));
    }
  };

  const applyPreset = (preset) => {
    setWidth(preset.w);
    setHeight(preset.h);
    showToast(`Set to ${preset.label} (${preset.w}×${preset.h})`, 'info');
  };

  const handlePreview = () => {
    if (!loadedImg || width <= 0 || height <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(loadedImg, 0, 0, width, height);
    setPreviewSrc(canvas.toDataURL(format, 0.95));
    showToast('Preview updated!', 'info');
  };

  const handleResizeDownload = () => {
    if (!loadedImg || width <= 0 || height <= 0) {
      showToast('Please check dimensions!', 'error');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(loadedImg, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (blob) {
        const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'resized';
        const ext = getExt(format);
        downloadBlob(blob, `${baseName}_${width}x${height}.${ext}`);
        confetti({ particleCount: 65, spread: 55, origin: { y: 0.8 } });
        showToast(`Resized to ${width}×${height} downloaded!`, 'success');
      }
    }, format, 0.95);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setOriginalSrc(null);
    setLoadedImg(null);
    setPreviewSrc(null);
    showToast('Image removed', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="font-primary text-3xl sm:text-5xl font-extrabold tracking-tight mb-2 text-[#201515] dark:text-[#fffefb]">
          Resize & <span className="text-[#ff4f00]">Crop Studio</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#605d52] dark:text-[#a0a8c0]">
          Scale pixels accurately, match social media presets, or visually crop with exact aspect ratios.
        </p>
      </div>

      {!selectedFile ? (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          title="Drop image to resize or crop"
          subtitle="Any image format accepted (JPG, PNG, WebP, AVIF, BMP, TIFF)"
        />
      ) : (
        <div className="p-6 sm:p-8 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)] flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('resize')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
                  activeTab === 'resize'
                    ? 'bg-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515]'
                    : 'border border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.2)] text-[#36342e] dark:text-[#a0a8c0] hover:border-[#201515]'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" /> Dimension Resize
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('crop')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
                  activeTab === 'crop'
                    ? 'bg-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515]'
                    : 'border border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.2)] text-[#36342e] dark:text-[#a0a8c0] hover:border-[#201515]'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" /> Visual Crop
              </button>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            >
              <X className="w-3.5 h-3.5" /> Remove Image
            </button>
          </div>

          {activeTab === 'resize' ? (
            <div>
              {/* Presets Grid */}
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2.5">
                  Popular Social & Screen Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="p-2.5 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-[#f8f4f0] dark:bg-[#1a1a1a] hover:border-[#201515] dark:hover:border-[#fffefb] transition-all text-center flex flex-col items-center justify-center gap-0.5 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none"
                    >
                      <span className="text-xs font-bold text-[#201515] dark:text-[#fffefb] leading-tight">
                        {p.label}
                      </span>
                      <span className="text-[10px] text-[#605d52] dark:text-[#a0a8c0] font-normal">
                        {p.w}×{p.h}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                    Width (Pixels)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={width}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                    Height (Pixels)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={height}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                    Output Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
                  >
                    <option value="image/jpeg">JPG / JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WEBP</option>
                  </select>
                </div>
              </div>

              {/* Lock Aspect Ratio Toggle */}
              <div className="flex items-center gap-3 mb-6 p-3 rounded-md border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f8f4f0] dark:bg-[#181818]">
                <button
                  type="button"
                  onClick={() => setLockAspect(!lockAspect)}
                  className={`p-2 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] ${
                    lockAspect 
                      ? 'bg-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515]' 
                      : 'border border-[rgba(32,21,21,0.2)] text-[#605d52]'
                  }`}
                >
                  {lockAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <div className="text-xs">
                  <span className="font-bold text-[#201515] dark:text-[#fffefb]">Lock Aspect Ratio</span>
                  <span className="text-[#605d52] dark:text-[#a0a8c0] block">
                    {lockAspect ? 'Width & height scale proportionally.' : 'Free custom size enabled.'}
                  </span>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="p-4 rounded-md border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f8f4f0] dark:bg-[#181818] text-center flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#605d52] dark:text-[#a0a8c0] uppercase tracking-wider block mb-2">
                      Original ({origW} × {origH} px)
                    </span>
                    <img
                      src={originalSrc}
                      alt="Original"
                      className="max-h-52 mx-auto rounded-md object-contain border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-black"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-[#252525] border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.15)] text-[#201515] dark:text-[#fffefb]">
                      {fmtBytes(selectedFile.size)}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-md border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f8f4f0] dark:bg-[#181818] text-center flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#605d52] dark:text-[#a0a8c0] uppercase tracking-wider block mb-2">
                      Resized Preview ({width} × {height} px)
                    </span>
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt="Resized Preview"
                        className="max-h-52 mx-auto rounded-md object-contain border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-black"
                      />
                    ) : (
                      <div className="h-52 flex flex-col items-center justify-center text-xs text-[#605d52] dark:text-[#a0a8c0] border border-dashed border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-md">
                        <Eye className="w-8 h-8 mb-2 opacity-40" />
                        Click "Preview" to generate scaled render
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-[#252525] border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.15)] text-[#ff4f00]">
                      {width} × {height} px
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-[rgba(32,21,21,0.2)] dark:border-[rgba(255,255,255,0.2)] bg-transparent hover:bg-[rgba(32,21,21,0.05)] text-xs font-semibold text-[#201515] dark:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
                <button
                  type="button"
                  onClick={handleResizeDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] text-white text-sm font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
                >
                  <Download className="w-4 h-4" /> Resize & Download
                </button>
              </div>
            </div>
          ) : (
            <CropTool
              imageSrc={originalSrc}
              naturalWidth={origW}
              naturalHeight={origH}
              outputFormat={format}
            />
          )}
        </div>
      )}

      <FaqSection />
    </div>
  );
}
