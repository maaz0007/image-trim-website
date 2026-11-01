import React, { useState } from 'react';
import UploadZone from '../components/UploadZone';
import FaqSection from '../components/FaqSection';
import { 
  readFile, loadImage, fmtBytes, getExt, mimeLabel, downloadBlob 
} from '../utils/imageUtils';
import { jsPDF } from 'jspdf';
import { useToast } from '../context/ToastContext';
import { 
  RefreshCw, Download, Eye, X, ArrowRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const FORMAT_PRESETS = [
  { id: 'jpg-to-png', from: 'JPG', to: 'PNG', mime: 'image/png' },
  { id: 'png-to-jpg', from: 'PNG', to: 'JPG', mime: 'image/jpeg' },
  { id: 'png-to-webp', from: 'PNG', to: 'WEBP', mime: 'image/webp' },
  { id: 'jpg-to-webp', from: 'JPG', to: 'WEBP', mime: 'image/webp' },
  { id: 'webp-to-png', from: 'WEBP', to: 'PNG', mime: 'image/png' },
  { id: 'webp-to-jpg', from: 'WEBP', to: 'JPG', mime: 'image/jpeg' },
  { id: 'jpg-to-pdf', from: 'JPG', to: 'PDF', mime: 'application/pdf' },
  { id: 'png-to-pdf', from: 'PNG', to: 'PDF', mime: 'application/pdf' },
  { id: 'jpg-to-avif', from: 'JPG', to: 'AVIF', mime: 'image/avif' },
  { id: 'png-to-avif', from: 'PNG', to: 'AVIF', mime: 'image/avif' },
  { id: 'jpg-to-svg', from: 'JPG', to: 'SVG', mime: 'image/svg+xml' },
  { id: 'png-to-svg', from: 'PNG', to: 'SVG', mime: 'image/svg+xml' },
];

export default function ConvertPage() {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalSrc, setOriginalSrc] = useState(null);
  const [loadedImg, setLoadedImg] = useState(null);

  const [selectedPresetId, setSelectedPresetId] = useState('jpg-to-png');
  const [targetFormat, setTargetFormat] = useState('image/png');
  const [quality, setQuality] = useState(92);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewSize, setPreviewSize] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      const src = await readFile(file);
      setOriginalSrc(src);
      const img = await loadImage(src);
      setLoadedImg(img);
      setPreviewSrc(null);
      setPreviewSize(null);

      // Auto-tune preset if current preset outputs the same format as the uploaded file
      const fileExt = getExt(file.type).toUpperCase();
      const currentPreset = FORMAT_PRESETS.find(p => p.id === selectedPresetId);
      if (currentPreset && currentPreset.to === fileExt) {
        const altPreset = FORMAT_PRESETS.find(p => p.from === fileExt);
        if (altPreset) {
          setSelectedPresetId(altPreset.id);
          setTargetFormat(altPreset.mime);
        }
      }

      showToast('Image loaded! Choose output format.', 'success');
    } catch (err) {
      showToast('Failed to load image file.', 'error');
    }
  };

  const handlePresetSelect = (preset) => {
    setSelectedPresetId(preset.id);
    setTargetFormat(preset.mime);
    showToast(`Target format set to ${preset.to}`, 'info');
  };

  const handleFormatChange = (newMime) => {
    setTargetFormat(newMime);
    const inputExt = selectedFile ? getExt(selectedFile.type).toUpperCase() : null;
    const matching = FORMAT_PRESETS.find(p => (inputExt ? p.from === inputExt : true) && p.mime === newMime)
      || FORMAT_PRESETS.find(p => p.mime === newMime);
    setSelectedPresetId(matching ? matching.id : null);
  };

  const handlePreview = () => {
    if (!loadedImg) return;
    const canvas = document.createElement('canvas');
    canvas.width = loadedImg.width;
    canvas.height = loadedImg.height;
    const ctx = canvas.getContext('2d');

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(loadedImg, 0, 0);

    const q = quality / 100;
    const dataUrl = canvas.toDataURL(targetFormat === 'application/pdf' || targetFormat === 'image/svg+xml' ? 'image/png' : targetFormat, q);
    setPreviewSrc(dataUrl);
    const estBytes = Math.round(dataUrl.length * 0.75);
    setPreviewSize(estBytes);
    showToast('Preview updated!', 'info');
  };

  const handleConvert = async () => {
    if (!loadedImg) {
      showToast('Please upload an image first!', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = loadedImg.width;
      canvas.height = loadedImg.height;
      const ctx = canvas.getContext('2d');

      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(loadedImg, 0, 0);

      const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'image';

      if (targetFormat === 'application/pdf') {
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${baseName}.pdf`);
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.8 } });
        showToast('Converted and downloaded as PDF!', 'success');
        setIsProcessing(false);
        return;
      }

      if (targetFormat === 'image/svg+xml') {
        const dataUrl = canvas.toDataURL('image/png', 1);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        downloadBlob(blob, `${baseName}.svg`);
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.8 } });
        showToast('Converted and downloaded as SVG!', 'success');
        setIsProcessing(false);
        return;
      }

      const q = quality / 100;
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${baseName}.${getExt(targetFormat)}`);
          confetti({ particleCount: 60, spread: 55, origin: { y: 0.8 } });
          showToast(`Converted to ${mimeLabel(targetFormat)} successfully!`, 'success');
        }
        setIsProcessing(false);
      }, targetFormat, q);
    } catch (err) {
      showToast('Error during conversion: ' + err.message, 'error');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setOriginalSrc(null);
    setLoadedImg(null);
    setPreviewSrc(null);
    setPreviewSize(null);
    showToast('Image removed', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="font-primary text-3xl sm:text-5xl font-extrabold tracking-tight mb-2 text-[#201515] dark:text-[#fffefb]">
          Image <span className="text-[#ff4f00]">Converter</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#605d52] dark:text-[#a0a8c0]">
          Convert between JPG, PNG, WEBP, AVIF, PDF, SVG, BMP & TIFF in full fidelity without server upload.
        </p>
      </div>

      {/* Format Preset Pills */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-3 text-center sm:text-left">
          Quick Format Presets
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {FORMAT_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-lg border text-center transition-all duration-200 flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
                  isSelected
                    ? 'border-[#ff4f00] bg-[rgba(255,79,0,0.08)] shadow-sm'
                    : 'border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] hover:border-[#201515] dark:hover:border-[#fffefb]'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#605d52] dark:text-[#a0a8c0]">
                  <span>{preset.from}</span>
                  <ArrowRight className="w-3 h-3 text-[#ff4f00]" />
                </div>
                <span className="font-primary text-sm font-bold text-[#201515] dark:text-[#fffefb]">
                  {preset.to}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Upload / Control Box */}
      {!selectedFile ? (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          title="Drop image here or click to convert"
          subtitle="Supports JPG, PNG, WEBP, GIF, BMP, TIFF, SVG, AVIF"
        />
      ) : (
        <div className="p-6 sm:p-8 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)]">
            <h3 className="font-primary text-base font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#ff4f00]" /> Conversion Settings
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            >
              <X className="w-3.5 h-3.5" /> Remove Image
            </button>
          </div>

          {/* Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                Output Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => handleFormatChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
              >
                <option value="image/jpeg">JPG / JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WEBP (Modern & Compact)</option>
                <option value="image/avif">AVIF (Ultra High Compression)</option>
                <option value="application/pdf">PDF Document</option>
                <option value="image/svg+xml">SVG Vector Container</option>
                <option value="image/bmp">BMP Bitmap</option>
                <option value="image/tiff">TIFF</option>
              </select>
            </div>

            {targetFormat !== 'application/pdf' && targetFormat !== 'image/svg+xml' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0]">
                    Quality
                  </label>
                  <span className="text-xs font-bold text-[#ff4f00]">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-[rgba(32,21,21,0.1)] dark:bg-[rgba(255,255,255,0.15)] rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Before & After Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Original Card */}
            <div className="p-4 rounded-md border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f8f4f0] dark:bg-[#181818] text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#605d52] dark:text-[#a0a8c0] uppercase tracking-wider block mb-2">
                  Original Image
                </span>
                <img
                  src={originalSrc}
                  alt="Original"
                  className="max-h-52 mx-auto rounded-md object-contain border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-black"
                />
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-[#252525] border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.15)] text-[#201515] dark:text-[#fffefb]">
                  {selectedFile.type ? mimeLabel(selectedFile.type) : 'ORIGINAL'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-[#252525] border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.15)] text-[#ff4f00]">
                  {fmtBytes(selectedFile.size)}
                </span>
                {loadedImg && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-[#252525] border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.15)] text-[#605d52] dark:text-[#a0a8c0]">
                    {loadedImg.width} × {loadedImg.height}
                  </span>
                )}
              </div>
            </div>

            {/* Converted Preview Card */}
            <div className="p-4 rounded-md border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f8f4f0] dark:bg-[#181818] text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#605d52] dark:text-[#a0a8c0] uppercase tracking-wider block mb-2">
                  Converted Preview
                </span>
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt="Converted Preview"
                    className="max-h-52 mx-auto rounded-md object-contain border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-black"
                  />
                ) : (
                  <div className="h-52 flex flex-col items-center justify-center text-xs text-[#605d52] dark:text-[#a0a8c0] border border-dashed border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-md">
                    <Eye className="w-8 h-8 mb-2 opacity-40" />
                    Click "Preview" to inspect output
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {mimeLabel(targetFormat)}
                </span>
                {previewSize && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-[#252525] border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.15)] text-[#ff4f00]">
                    ~{fmtBytes(previewSize)}
                  </span>
                )}
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
              onClick={handleConvert}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            >
              <Download className="w-4 h-4" />
              {isProcessing ? 'Converting...' : 'Convert & Download'}
            </button>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-14">
        <div className="p-5 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212]">
          <div className="font-primary text-xl font-extrabold text-[#ff4f00] mb-1">01</div>
          <h4 className="font-bold text-sm text-[#201515] dark:text-[#fffefb] mb-1">Pick Target Format</h4>
          <p className="text-xs text-[#605d52] dark:text-[#a0a8c0] leading-relaxed">
            Choose from JPG, PNG, WEBP, AVIF, PDF, SVG, and configure compression.
          </p>
        </div>
        <div className="p-5 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212]">
          <div className="font-primary text-xl font-extrabold text-[#201515] dark:text-[#fffefb] mb-1">02</div>
          <h4 className="font-bold text-sm text-[#201515] dark:text-[#fffefb] mb-1">Drop Image</h4>
          <p className="text-xs text-[#605d52] dark:text-[#a0a8c0] leading-relaxed">
            Drag and drop your file, paste from clipboard, or click to browse.
          </p>
        </div>
        <div className="p-5 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212]">
          <div className="font-primary text-xl font-extrabold text-[#ff4f00] mb-1">03</div>
          <h4 className="font-bold text-sm text-[#201515] dark:text-[#fffefb] mb-1">Instant Download</h4>
          <p className="text-xs text-[#605d52] dark:text-[#a0a8c0] leading-relaxed">
            Conversion executes in milliseconds entirely in your browser.
          </p>
        </div>
      </div>

      <FaqSection />
    </div>
  );
}
