import React, { useState } from 'react';
import UploadZone from '../components/UploadZone';
import FaqSection from '../components/FaqSection';
import { 
  readFile, loadImage, fmtBytes, getExt, mimeLabel, downloadBlob 
} from '../utils/imageUtils';
import { useToast } from '../context/ToastContext';
import JSZip from 'jszip';
import { Layers, Download, X, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BulkPage() {
  const { showToast } = useToast();
  const [files, setFiles] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const [format, setFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(90);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = async (newFiles) => {
    if (!newFiles.length) return;
    const limitedFiles = newFiles.slice(0, 50);
    setFiles(limitedFiles);

    // Generate thumbnails
    const thumbs = await Promise.all(
      limitedFiles.map(async (file) => {
        const src = await readFile(file);
        return { name: file.name, size: file.size, src };
      })
    );
    setThumbnails(thumbs);
    showToast(`${limitedFiles.length} images loaded for bulk processing!`, 'success');
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setThumbnails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkConvert = async () => {
    if (!files.length) {
      showToast('Please select images first!', 'error');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const ext = getExt(format);
      const q = quality / 100;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const src = await readFile(file);
        const img = await loadImage(src);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        const blob = await new Promise((res) => canvas.toBlob(res, format, q));
        const cleanName = file.name.replace(/\.[^.]+$/, '');
        zip.file(`${cleanName}.${ext}`, blob);

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'imagetrim_bulk_converted.zip');
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.8 } });
      showToast(`${files.length} images converted and zipped!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error during bulk conversion.', 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] shadow-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#ff4f00]" /> High-Throughput Batch Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#201515] dark:text-[#fffefb] mb-3">
          Bulk <span className="text-[#ff4f00]">Image Converter</span>
        </h1>
        <p className="text-sm sm:text-base text-[#605d52] dark:text-[#9f9b8f]">
          Upload up to 50 images, convert them simultaneously in-browser, and download a single compressed ZIP archive.
        </p>
      </div>

      {files.length === 0 ? (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          multiple={true}
          title="Drop multiple images here (up to 50)"
          subtitle="Supports JPG, PNG, WEBP, AVIF, TIFF, BMP, SVG"
        />
      ) : (
        <div className="p-6 sm:p-8 rounded-lg sm:rounded-xl border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm animate-fade-up">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] flex-wrap gap-3">
            <h3 className="text-base sm:text-lg font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#ff4f00]" /> {files.length} Images in Batch
            </h3>
            <button
              onClick={() => {
                setFiles([]);
                setThumbnails([]);
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-2">
                Convert All To
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:ring-2 focus:ring-[#ff4f00]"
              >
                <option value="image/jpeg">JPG / JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WEBP</option>
                <option value="image/bmp">BMP</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f]">
                  Batch Quality
                </label>
                <span className="text-xs font-bold text-[#ff4f00]">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2 accent-[#ff4f00] bg-[rgba(32,21,21,0.1)] dark:bg-[rgba(255,255,255,0.1)] rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-[#605d52] dark:text-[#9f9b8f] mb-1.5">
                <span>Converting batch images...</span>
                <span className="font-bold text-[#ff4f00]">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(32,21,21,0.1)] dark:bg-[rgba(255,255,255,0.1)] overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-[#ff4f00] transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Thumbnail Gallery Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6 max-h-96 overflow-y-auto pr-1">
            {thumbnails.map((thumb, idx) => (
              <div
                key={idx}
                className="relative p-2.5 rounded-md border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-[#f8f4f0] dark:bg-[#0a0a0a] text-center flex flex-col justify-between"
              >
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#201515] dark:bg-[#fffefb] text-[#fffefb] dark:text-[#201515] text-[10px] flex items-center justify-center font-bold shadow-xs hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-colors"
                  title="Remove this image"
                >
                  ✕
                </button>
                <img
                  src={thumb.src}
                  alt={thumb.name}
                  className="h-16 w-full object-cover rounded-sm mb-1.5 border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#1a1a1a]"
                />
                <div className="text-[11px] font-semibold text-[#201515] dark:text-[#fffefb] truncate">
                  {thumb.name}
                </div>
                <div className="text-[10px] text-[#605d52] dark:text-[#9f9b8f] font-semibold">
                  {fmtBytes(thumb.size)}
                </div>
              </div>
            ))}
          </div>

          {/* Convert & ZIP Button */}
          <button
            onClick={handleBulkConvert}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] active:bg-[#c93e00] text-[#fffefb] font-bold text-sm shadow-sm transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
          >
            <Download className="w-5 h-5" />
            {isProcessing ? `Processing ${progress}%...` : `Convert All & Download ZIP (${files.length} images)`}
          </button>
        </div>
      )}

      <FaqSection />
    </div>
  );
}

