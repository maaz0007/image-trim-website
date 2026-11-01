import React, { useState, useEffect, useRef } from 'react';
import UploadZone from '../components/UploadZone';
import FaqSection from '../components/FaqSection';
import { 
  readFile, loadImage, fmtBytes, getExt, mimeLabel, downloadBlob, compressImageToTarget 
} from '../utils/imageUtils';
import { useToast } from '../context/ToastContext';
import { Archive, Download, X, ArrowDownRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const COMPRESS_PRESETS = [
  { label: '50 KB', targetKB: 50 },
  { label: '100 KB', targetKB: 100 },
  { label: '200 KB', targetKB: 200 },
  { label: '500 KB', targetKB: 500 },
  { label: '1 MB', targetKB: 1024 },
  { label: '2 MB', targetKB: 2048 },
];

export default function CompressPage() {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalSrc, setOriginalSrc] = useState(null);
  const [loadedImg, setLoadedImg] = useState(null);

  const [mode, setMode] = useState('target');
  const [targetKB, setTargetKB] = useState(100);
  const [customValue, setCustomValue] = useState(100);
  const [customUnit, setCustomUnit] = useState('kb');
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('image/jpeg');

  const [compressedBlob, setCompressedBlob] = useState(null);
  const [compressedSrc, setCompressedSrc] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const jobCounter = useRef(0);

  const handleFilesSelected = async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      const src = await readFile(file);
      setOriginalSrc(src);
      const img = await loadImage(src);
      setLoadedImg(img);
      showToast('Image loaded! Compressing...', 'success');
    } catch (err) {
      showToast('Failed to load image.', 'error');
    }
  };

  useEffect(() => {
    if (!loadedImg || !selectedFile) return;

    const performCompression = async () => {
      const jobId = ++jobCounter.current;
      setIsCompressing(true);

      try {
        if (mode === 'target') {
          const targetBytes = Math.max(1024, targetKB * 1024);
          const result = await compressImageToTarget(loadedImg, format, targetBytes);
          if (jobId !== jobCounter.current) return;

          if (result && result.blob) {
            setCompressedBlob(result.blob);
            setCompressedSrc(result.canvas.toDataURL(format));
            setCompressedSize(result.blob.size);
          }
        } else {
          const canvas = document.createElement('canvas');
          canvas.width = loadedImg.width;
          canvas.height = loadedImg.height;
          const ctx = canvas.getContext('2d');
          if (format === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(loadedImg, 0, 0);

          const q = quality / 100;
          canvas.toBlob((blob) => {
            if (jobId !== jobCounter.current) return;
            if (blob) {
              setCompressedBlob(blob);
              setCompressedSrc(canvas.toDataURL(format, q));
              setCompressedSize(blob.size);
            }
          }, format, q);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (jobId === jobCounter.current) {
          setIsCompressing(false);
        }
      }
    };

    const timer = setTimeout(performCompression, 200);
    return () => clearTimeout(timer);
  }, [loadedImg, selectedFile, mode, targetKB, quality, format]);

  const handlePresetClick = (preset) => {
    setMode('target');
    setTargetKB(preset.targetKB);
    showToast(`Target set to under ${preset.label}`, 'info');
  };

  const handleApplyCustomTarget = () => {
    const val = parseFloat(customValue) || 100;
    const kb = customUnit === 'mb' ? val * 1024 : val;
    setMode('target');
    setTargetKB(kb);
    showToast(`Target set to ${val} ${customUnit.toUpperCase()}`, 'info');
  };

  const handleDownload = () => {
    if (!compressedBlob) return;
    const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'compressed';
    const ext = getExt(format);
    downloadBlob(compressedBlob, `${baseName}_compressed.${ext}`);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
    showToast('Compressed image downloaded!', 'success');
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setOriginalSrc(null);
    setLoadedImg(null);
    setCompressedBlob(null);
    setCompressedSrc(null);
    setCompressedSize(null);
    showToast('Image removed', 'info');
  };

  const savedBytes = selectedFile && compressedSize ? Math.max(0, selectedFile.size - compressedSize) : 0;
  const savedPercent = selectedFile && compressedSize ? Math.round((savedBytes / selectedFile.size) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="font-primary text-3xl sm:text-5xl font-extrabold tracking-tight mb-2 text-[#201515] dark:text-[#fffefb]">
          Smart Image <span className="text-[#ff4f00]">Compressor</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#605d52] dark:text-[#a0a8c0]">
          Compress JPG, PNG, and WEBP to exact target file sizes without losing visual quality.
        </p>
      </div>

      {/* Target Presets Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0]">
            Target File Size Presets
          </h2>
          <div className="flex items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('target')}
              className={`px-3 py-1 rounded-full border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
                mode === 'target'
                  ? 'bg-[#201515] border-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:border-[#fffefb] dark:text-[#201515]'
                  : 'border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.18)] text-[#36342e] dark:text-[#a0a8c0] hover:border-[#201515]'
              }`}
            >
              Target Size
            </button>
            <button
              type="button"
              onClick={() => setMode('quality')}
              className={`px-3 py-1 rounded-full border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
                mode === 'quality'
                  ? 'bg-[#201515] border-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:border-[#fffefb] dark:text-[#201515]'
                  : 'border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.18)] text-[#36342e] dark:text-[#a0a8c0] hover:border-[#201515]'
              }`}
            >
              Custom Quality %
            </button>
          </div>
        </div>

        {mode === 'target' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
            {COMPRESS_PRESETS.map((p) => {
              const isSelected = targetKB === p.targetKB;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePresetClick(p)}
                  className={`p-3 rounded-lg border text-center transition-all duration-200 flex flex-col items-center justify-center gap-0.5 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
                    isSelected
                      ? 'border-[#ff4f00] bg-[rgba(255,79,0,0.08)] shadow-sm'
                      : 'border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] hover:border-[#201515] dark:hover:border-[#fffefb]'
                  }`}
                >
                  <span className="text-[11px] text-[#605d52] dark:text-[#a0a8c0] font-normal">Under</span>
                  <span className="font-primary text-sm font-bold text-[#201515] dark:text-[#fffefb]">
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0]">Quality:</span>
            <input
              type="range"
              min="5"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="flex-1 h-2 bg-[rgba(32,21,21,0.1)] dark:bg-[rgba(255,255,255,0.15)] rounded-lg cursor-pointer"
            />
            <span className="font-primary text-sm font-bold text-[#ff4f00] min-w-[3rem] text-right">
              {quality}%
            </span>
          </div>
        )}
      </div>

      {/* Upload Zone or Control Card */}
      {!selectedFile ? (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          title="Drop image here to compress"
          subtitle="Supports JPG, PNG, WEBP — automatically reduces file size"
        />
      ) : (
        <div className="p-6 sm:p-8 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)] flex-wrap gap-3">
            <h3 className="font-primary text-base font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
              <Archive className="w-4 h-4 text-[#ff4f00]" />
              {mode === 'target' ? `Target: under ${fmtBytes(targetKB * 1024)}` : `Quality: ${quality}%`}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            >
              <X className="w-3.5 h-3.5" /> Remove Image
            </button>
          </div>

          {/* Controls: Custom KB/MB & Format Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                Output Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
              >
                <option value="image/jpeg">JPG (Best Compatibility)</option>
                <option value="image/webp">WEBP (Smallest Size)</option>
                <option value="image/png">PNG (Lossless Transparency)</option>
              </select>
            </div>

            {mode === 'target' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                  Custom Target Size
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
                    placeholder="Enter size..."
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00]"
                  >
                    <option value="kb">KB</option>
                    <option value="mb">MB</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleApplyCustomTarget}
                    className="px-4 py-2.5 rounded-md bg-[#201515] dark:bg-[#fffefb] text-[#fffefb] dark:text-[#201515] text-xs font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Size Savings Metric Banner */}
          <div className="p-4 rounded-md border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.12)] bg-[#f8f4f0] dark:bg-[#181818] mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-[#605d52] dark:text-[#a0a8c0] font-normal">
                  Original: <strong className="text-[#201515] dark:text-[#fffefb] font-semibold">{fmtBytes(selectedFile.size)}</strong> → Compressed: <strong className="text-[#ff4f00] font-semibold">{compressedSize ? fmtBytes(compressedSize) : 'Processing...'}</strong>
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
                  Saved {fmtBytes(savedBytes)} ({savedPercent}% reduction)
                </div>
              </div>
            </div>

            {isCompressing && (
              <span className="text-xs font-semibold text-[#ff4f00] animate-pulse">
                Optimizing canvas...
              </span>
            )}
          </div>

          {/* Side by side Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
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
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-[#252525] border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.15)] text-[#201515] dark:text-[#fffefb]">
                  {fmtBytes(selectedFile.size)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-md border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f8f4f0] dark:bg-[#181818] text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#605d52] dark:text-[#a0a8c0] uppercase tracking-wider block mb-2">
                  Compressed Output
                </span>
                {compressedSrc ? (
                  <img
                    src={compressedSrc}
                    alt="Compressed"
                    className="max-h-52 mx-auto rounded-md object-contain border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-black"
                  />
                ) : (
                  <div className="h-52 flex items-center justify-center text-xs text-[#605d52] dark:text-[#a0a8c0]">
                    Generating compression...
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {compressedSize ? fmtBytes(compressedSize) : '...'}
                </span>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!compressedBlob || isCompressing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#ff4f00] hover:bg-[#e04500] text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
          >
            <Download className="w-4 h-4" /> Download Compressed Image
          </button>
        </div>
      )}

      <FaqSection
        customFaqs={[
          {
            q: 'How does client-side compression work?',
            a: 'ImageTrim uses the HTML5 Canvas API with intelligent dimension interpolation and binary quantization to reduce file bytes while preserving perceptual clarity.'
          },
          {
            q: 'Can I compress an image to exactly 100KB or 200KB?',
            a: 'Yes. In "Target Size" mode, ImageTrim executes iterative scaling cycles to get your image as close to your specified target size as mathematically possible.'
          },
          {
            q: 'Does it support transparency in PNG or WebP?',
            a: 'Yes, if you select WEBP or PNG output format, transparent alpha channels are fully retained.'
          }
        ]}
      />
    </div>
  );
}
