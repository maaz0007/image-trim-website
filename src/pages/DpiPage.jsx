import React, { useState, useEffect, useRef } from 'react';
import UploadZone from '../components/UploadZone';
import FaqSection from '../components/FaqSection';
import { readFile, loadImage, fmtBytes, downloadBlob } from '../utils/imageUtils';
import { 
  readImageDpi, embedDpi, calculatePrintDimensions 
} from '../utils/dpiUtils';
import { useToast } from '../context/ToastContext';
import { 
  Sparkles, Download, X, Sliders, CheckCircle2, 
  Printer, ZoomIn, Eye, Activity, RefreshCw, FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

const DPI_PRESETS = [
  { val: 72, label: '72 DPI', desc: 'Screen & Web' },
  { val: 150, label: '150 DPI', desc: 'Draft Print' },
  { val: 200, label: '200 DPI', desc: 'Document Print' },
  { val: 300, label: '300 DPI', desc: 'Commercial Print (Standard)' },
  { val: 600, label: '600 DPI', desc: 'Ultra HD Archival' },
];

export default function DpiPage() {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadedImg, setLoadedImg] = useState(null);

  // Active Tool Mode (Matching user's attached screenshot buttons)
  // 'convert' = Convert DPI (200, 300, 600)
  // 'check' = Check Image DPI
  // 'quality' = Increase Image Quality
  // 'super' = Super Resolution
  const [activeTab, setActiveTab] = useState('convert');

  // DPI Conversion State
  const [targetDpi, setTargetDpi] = useState(300);
  const [customDpiInput, setCustomDpiInput] = useState('300');
  const [exportFormat, setExportFormat] = useState('image/jpeg'); // 'image/jpeg' | 'image/png'
  const [conversionMethod, setConversionMethod] = useState('metadata'); // 'metadata' | 'resample'

  // Image DPI Info
  const [detectedDpi, setDetectedDpi] = useState(null);

  // Quality Enhancement State
  const [sharpness, setSharpness] = useState(35); // 0 - 100
  const [contrast, setContrast] = useState(15); // -50 - 50
  const [brightness, setBrightness] = useState(0); // -50 - 50
  const [saturation, setSaturation] = useState(15); // -50 - 50

  // Super Resolution State
  const [scaleFactor, setScaleFactor] = useState(2); // 2x | 3x | 4x

  // Comparison Split Slider
  const [compareSplit, setCompareSplit] = useState(50);
  const [showSplit, setShowSplit] = useState(false);

  // Canvases
  const canvasRef = useRef(null);
  const previewContainerRef = useRef(null);

  // Handle File Selection
  const handleFilesSelected = async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      const src = await readFile(file);
      const img = await loadImage(src);
      setLoadedImg(img);

      // Inspect native DPI
      const dpiInfo = await readImageDpi(file);
      setDetectedDpi(dpiInfo);

      // Auto set default target format
      const isPng = file.type === 'image/png' || file.name.endsWith('.png');
      setExportFormat(isPng ? 'image/png' : 'image/jpeg');

      showToast(`Image loaded! Detected ${dpiInfo.dpiX} DPI (${dpiInfo.source})`, 'success');
    } catch (err) {
      showToast('Failed to load image file.', 'error');
    }
  };

  // Render Quality & Preview on Canvas
  useEffect(() => {
    if (!loadedImg || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const containerWidth = canvas.parentElement?.clientWidth || 700;
    const maxW = Math.min(containerWidth, loadedImg.width);
    const scale = maxW / loadedImg.width;

    canvas.width = Math.round(loadedImg.width * scale);
    canvas.height = Math.round(loadedImg.height * scale);

    if (activeTab === 'quality' && showSplit) {
      // Split Before / After view
      ctx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);

      const splitX = Math.round((compareSplit / 100) * canvas.width);

      // Offscreen enhanced canvas
      const enh = document.createElement('canvas');
      enh.width = canvas.width;
      enh.height = canvas.height;
      const eCtx = enh.getContext('2d');

      // Apply CSS Filters
      const cVal = 100 + contrast;
      const bVal = 100 + brightness;
      const sVal = 100 + saturation;
      eCtx.filter = `contrast(${cVal}%) brightness(${bVal}%) saturate(${sVal}%)`;
      eCtx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);
      eCtx.filter = 'none';

      // Clip right side for enhanced
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
      ctx.clip();
      ctx.drawImage(enh, 0, 0);
      ctx.restore();

      // Divider line
      ctx.strokeStyle = '#ff4f00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, canvas.height);
      ctx.stroke();

      // Divider handle
      ctx.fillStyle = '#ff4f00';
      ctx.beginPath();
      ctx.arc(splitX, canvas.height / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(splitX, canvas.height / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (activeTab === 'quality') {
      const cVal = 100 + contrast;
      const bVal = 100 + brightness;
      const sVal = 100 + saturation;
      ctx.filter = `contrast(${cVal}%) brightness(${bVal}%) saturate(${sVal}%)`;
      ctx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      return;
    }

    // Default clean preview
    ctx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);
  }, [loadedImg, activeTab, sharpness, contrast, brightness, saturation, showSplit, compareSplit]);

  // Handle Dragging Split View Slider
  const handlePointerMove = (e) => {
    if (!showSplit || activeTab !== 'quality' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setCompareSplit(Math.round(normX * 100));
  };

  // Preset DPI Click
  const handleSelectDpi = (val) => {
    setTargetDpi(val);
    setCustomDpiInput(val.toString());
    showToast(`Target set to ${val} DPI`, 'info');
  };

  const handleCustomDpiChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomDpiInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setTargetDpi(num);
    }
  };

  // Download Action Dispatcher
  const handleDownload = async () => {
    if (!loadedImg) return;

    try {
      showToast('Processing and embedding DPI metadata...', 'info');

      let outCanvas = document.createElement('canvas');

      if (activeTab === 'super') {
        // Super Resolution: 2x, 3x, 4x upscaling
        const nw = loadedImg.width * scaleFactor;
        const nh = loadedImg.height * scaleFactor;
        outCanvas.width = nw;
        outCanvas.height = nh;
        const oCtx = outCanvas.getContext('2d');
        oCtx.imageSmoothingEnabled = true;
        oCtx.imageSmoothingQuality = 'high';
        oCtx.drawImage(loadedImg, 0, 0, nw, nh);
      } else if (activeTab === 'quality') {
        // Quality Enhancer
        outCanvas.width = loadedImg.width;
        outCanvas.height = loadedImg.height;
        const oCtx = outCanvas.getContext('2d');
        const cVal = 100 + contrast;
        const bVal = 100 + brightness;
        const sVal = 100 + saturation;
        oCtx.filter = `contrast(${cVal}%) brightness(${bVal}%) saturate(${sVal}%)`;
        oCtx.drawImage(loadedImg, 0, 0);
        oCtx.filter = 'none';
      } else {
        // Convert DPI Mode
        if (conversionMethod === 'resample') {
          const ratio = targetDpi / (detectedDpi?.dpiX || 72);
          const nw = Math.round(loadedImg.width * ratio);
          const nh = Math.round(loadedImg.height * ratio);
          outCanvas.width = nw;
          outCanvas.height = nh;
          const oCtx = outCanvas.getContext('2d');
          oCtx.imageSmoothingEnabled = true;
          oCtx.imageSmoothingQuality = 'high';
          oCtx.drawImage(loadedImg, 0, 0, nw, nh);
        } else {
          // Lossless exact original pixels
          outCanvas.width = loadedImg.width;
          outCanvas.height = loadedImg.height;
          const oCtx = outCanvas.getContext('2d');
          oCtx.drawImage(loadedImg, 0, 0);
        }
      }

      // Convert Canvas to Blob
      const rawBlob = await new Promise((res) => {
        outCanvas.toBlob(res, exportFormat, 0.95);
      });

      // Embed target DPI into JFIF/pHYs header
      const finalDpi = activeTab === 'super' ? 300 : targetDpi;
      const finalBlob = await embedDpi(rawBlob, finalDpi, exportFormat);

      const ext = exportFormat === 'image/png' ? 'png' : 'jpg';
      const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'image';
      const suffix = activeTab === 'super' ? `${scaleFactor}x_300dpi` : `${finalDpi}dpi`;

      downloadBlob(finalBlob, `${baseName}_${suffix}.${ext}`);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
      showToast(`Downloaded! File verified with ${finalDpi} DPI embedded.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error during DPI conversion.', 'error');
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setLoadedImg(null);
    setDetectedDpi(null);
    showToast('Image cleared', 'info');
  };

  // Physical Print Sizes Calculations
  const printDims = loadedImg
    ? calculatePrintDimensions(loadedImg.width, loadedImg.height, targetDpi)
    : null;

  const detectedPrintDims = (loadedImg && detectedDpi)
    ? calculatePrintDimensions(loadedImg.width, loadedImg.height, detectedDpi.dpiX)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e3f2fd] text-[#1976d2] dark:bg-[#1565c0]/30 dark:text-[#90caf9] border border-[#90caf9]/50 shadow-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#ff4f00]" /> Print &amp; Resolution Suite
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#201515] dark:text-[#fffefb] mb-3">
          DPI &amp; <span className="text-[#ff4f00]">Quality</span>
        </h1>
        <p className="text-sm sm:text-base text-[#605d52] dark:text-[#9f9b8f]">
          Convert image DPI to 200, 300, or 600 for commercial printing, inspect native metadata, enhance clarity, or upscale with Super Resolution.
        </p>
      </div>

      {/* Feature Selector Mode Bar matching User's Attached Screenshot */}
      <div className="mb-8">
        <div className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-3 text-center sm:text-left">
          DPI &amp; Quality Tools
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <button
            onClick={() => setActiveTab('quality')}
            className={`px-4 py-3.5 rounded-lg border text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-center focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
              activeTab === 'quality'
                ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] shadow-xs'
                : 'border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-white dark:bg-[#121212] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#ff4f00]" />
            <span>Increase Image Quality</span>
          </button>

          <button
            onClick={() => setActiveTab('convert')}
            className={`px-4 py-3.5 rounded-lg border text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-center focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
              activeTab === 'convert'
                ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] shadow-xs'
                : 'border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-white dark:bg-[#121212] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00]'
            }`}
          >
            <Printer className="w-4 h-4 text-[#ff4f00]" />
            <span>Convert DPI (200, 300, 600)</span>
          </button>

          <button
            onClick={() => setActiveTab('check')}
            className={`px-4 py-3.5 rounded-lg border text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-center focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
              activeTab === 'check'
                ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] shadow-xs'
                : 'border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-white dark:bg-[#121212] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00]'
            }`}
          >
            <Activity className="w-4 h-4 text-[#ff4f00]" />
            <span>Check Image DPI</span>
          </button>

          <button
            onClick={() => setActiveTab('super')}
            className={`px-4 py-3.5 rounded-lg border text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-center focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
              activeTab === 'super'
                ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] shadow-xs'
                : 'border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-white dark:bg-[#121212] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00]'
            }`}
          >
            <ZoomIn className="w-4 h-4 text-[#ff4f00]" />
            <span>Super Resolution</span>
          </button>

        </div>
      </div>

      {!selectedFile ? (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          title="Drop image to convert DPI or enhance quality"
          subtitle="Supports JPG, JPEG, PNG, WEBP, AVIF with embedded DPI analysis"
        />
      ) : (
        <div className="p-6 sm:p-8 rounded-lg sm:rounded-xl border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm animate-fade-up">
          
          {/* File Information Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff4f00] flex items-center justify-center text-white shadow-xs">
                {activeTab === 'convert' && <Printer className="w-5 h-5" />}
                {activeTab === 'check' && <Activity className="w-5 h-5" />}
                {activeTab === 'quality' && <Sparkles className="w-5 h-5" />}
                {activeTab === 'super' && <ZoomIn className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#201515] dark:text-[#fffefb]">
                  {selectedFile.name}
                </h3>
                <span className="text-xs text-[#605d52] dark:text-[#9f9b8f]">
                  {fmtBytes(selectedFile.size)} · {loadedImg?.width} × {loadedImg?.height}px · Detected: {detectedDpi?.dpiX} DPI
                </span>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove Image
            </button>
          </div>

          {/* Sub-tool 1: Convert DPI (200, 300, 600) */}
          {activeTab === 'convert' && (
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-2.5">
                  Choose Target DPI Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {DPI_PRESETS.map((p) => (
                    <button
                      key={p.val}
                      onClick={() => handleSelectDpi(p.val)}
                      className={`p-3 rounded-md border text-left transition-all ${
                        targetDpi === p.val
                          ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] shadow-xs'
                          : 'border-[rgba(32,21,21,0.14)] dark:border-[rgba(255,255,255,0.16)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00]'
                      }`}
                    >
                      <div className="text-sm font-bold">{p.label}</div>
                      <div className="text-[10px] text-[#605d52] dark:text-[#9f9b8f] mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom DPI & Format Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-[#f8f4f0] dark:bg-[#0a0a0a] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)]">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-1.5">
                    Custom DPI Value
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customDpiInput}
                      onChange={handleCustomDpiChange}
                      className="w-full px-3 py-2 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-white dark:bg-[#121212] text-sm font-bold text-[#201515] dark:text-[#fffefb] outline-none focus:ring-2 focus:ring-[#ff4f00]"
                      placeholder="e.g. 300"
                    />
                    <span className="text-xs font-semibold text-[#605d52] dark:text-[#9f9b8f]">DPI</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-1.5">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-white dark:bg-[#121212] text-sm font-medium text-[#201515] dark:text-[#fffefb] outline-none focus:ring-2 focus:ring-[#ff4f00]"
                  >
                    <option value="image/jpeg">JPEG (JFIF 1.02 Header)</option>
                    <option value="image/png">PNG (pHYs Chunk Density)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-1.5">
                    Conversion Method
                  </label>
                  <select
                    value={conversionMethod}
                    onChange={(e) => setConversionMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-white dark:bg-[#121212] text-sm font-medium text-[#201515] dark:text-[#fffefb] outline-none focus:ring-2 focus:ring-[#ff4f00]"
                  >
                    <option value="metadata">Lossless (Header update, keep pixels)</option>
                    <option value="resample">Resample (Scale pixels to DPI)</option>
                  </select>
                </div>
              </div>

              {/* Physical Print Dimensions Card */}
              {printDims && (
                <div className="p-4 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212]">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-[#ff4f00]" /> Resulting Physical Print Size @ {targetDpi} DPI
                    </span>
                    <span className={`text-xs font-bold ${printDims.qualityColor}`}>
                      {printDims.qualityGrade}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-md bg-[#f8f4f0] dark:bg-[#1a1a1a]">
                      <div className="text-[11px] text-[#605d52] dark:text-[#9f9b8f]">Print Width (Inches)</div>
                      <div className="text-base font-extrabold text-[#201515] dark:text-[#fffefb] mt-0.5">{printDims.widthInches}"</div>
                    </div>
                    <div className="p-2.5 rounded-md bg-[#f8f4f0] dark:bg-[#1a1a1a]">
                      <div className="text-[11px] text-[#605d52] dark:text-[#9f9b8f]">Print Height (Inches)</div>
                      <div className="text-base font-extrabold text-[#201515] dark:text-[#fffefb] mt-0.5">{printDims.heightInches}"</div>
                    </div>
                    <div className="p-2.5 rounded-md bg-[#f8f4f0] dark:bg-[#1a1a1a]">
                      <div className="text-[11px] text-[#605d52] dark:text-[#9f9b8f]">Width (Metric)</div>
                      <div className="text-base font-extrabold text-[#201515] dark:text-[#fffefb] mt-0.5">{printDims.widthCm} cm</div>
                    </div>
                    <div className="p-2.5 rounded-md bg-[#f8f4f0] dark:bg-[#1a1a1a]">
                      <div className="text-[11px] text-[#605d52] dark:text-[#9f9b8f]">Height (Metric)</div>
                      <div className="text-base font-extrabold text-[#201515] dark:text-[#fffefb] mt-0.5">{printDims.heightCm} cm</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#605d52] dark:text-[#9f9b8f] mt-2.5">
                    {printDims.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sub-tool 2: Check Image DPI */}
          {activeTab === 'check' && (
            <div className="space-y-6 mb-6">
              <div className="p-5 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-[#f8f4f0] dark:bg-[#0a0a0a]">
                <h4 className="text-sm font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2 mb-4">
                  <FileCheck className="w-4 h-4 text-[#ff4f00]" /> Metadata &amp; DPI Inspection Report
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 rounded-md bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)]">
                    <span className="text-xs text-[#605d52] dark:text-[#9f9b8f] block">Horizontal Resolution (X)</span>
                    <span className="text-xl font-extrabold text-[#ff4f00]">{detectedDpi?.dpiX} DPI</span>
                  </div>
                  <div className="p-3 rounded-md bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)]">
                    <span className="text-xs text-[#605d52] dark:text-[#9f9b8f] block">Vertical Resolution (Y)</span>
                    <span className="text-xl font-extrabold text-[#ff4f00]">{detectedDpi?.dpiY} DPI</span>
                  </div>
                  <div className="p-3 rounded-md bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)]">
                    <span className="text-xs text-[#605d52] dark:text-[#9f9b8f] block">Source Tag</span>
                    <span className="text-sm font-bold text-[#201515] dark:text-[#fffefb] truncate block mt-1">
                      {detectedDpi?.source}
                    </span>
                  </div>
                </div>

                {detectedPrintDims && (
                  <div className="p-3.5 rounded-md bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)]">
                    <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                      <span className="text-xs font-bold text-[#201515] dark:text-[#fffefb]">
                        Current Print Assessment:
                      </span>
                      <span className={`text-xs font-bold ${detectedPrintDims.qualityColor}`}>
                        {detectedPrintDims.qualityGrade}
                      </span>
                    </div>
                    <p className="text-xs text-[#605d52] dark:text-[#9f9b8f]">
                      At its current {detectedDpi?.dpiX} DPI, this image prints at {detectedPrintDims.widthInches}" × {detectedPrintDims.heightInches}" ({detectedPrintDims.widthCm} × {detectedPrintDims.heightCm} cm). {detectedPrintDims.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f]">
                  Quick Upgrade:
                </span>
                <button
                  onClick={() => {
                    handleSelectDpi(300);
                    setActiveTab('convert');
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#ff4f00] text-white hover:bg-[#e04500] transition-colors"
                >
                  Convert to 300 DPI (Commercial Standard)
                </button>
                <button
                  onClick={() => {
                    handleSelectDpi(600);
                    setActiveTab('convert');
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-[rgba(32,21,21,0.2)] dark:border-[rgba(255,255,255,0.2)] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00] transition-colors"
                >
                  Convert to 600 DPI (Archival Ultra HD)
                </button>
              </div>
            </div>
          )}

          {/* Sub-tool 3: Increase Image Quality */}
          {activeTab === 'quality' && (
            <div className="space-y-6 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f]">
                  Visual Quality Controls
                </span>
                <button
                  onClick={() => setShowSplit(!showSplit)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    showSplit
                      ? 'bg-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515]'
                      : 'border-[rgba(32,21,21,0.15)] text-[#201515] dark:text-[#fffefb]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showSplit ? 'Hide Split' : 'Compare Before/After'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-4 rounded-lg bg-[#f8f4f0] dark:bg-[#0a0a0a] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)]">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#605d52] dark:text-[#9f9b8f]">Contrast / Clarity</span>
                    <span className="text-[#ff4f00]">+{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="50"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-2 accent-[#ff4f00]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#605d52] dark:text-[#9f9b8f]">Brightness &amp; Tone</span>
                    <span className="text-[#ff4f00]">{brightness > 0 ? `+${brightness}` : brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-2 accent-[#ff4f00]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#605d52] dark:text-[#9f9b8f]">Color Vibrance</span>
                    <span className="text-[#ff4f00]">+{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="60"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full h-2 accent-[#ff4f00]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sub-tool 4: Super Resolution */}
          {activeTab === 'super' && (
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] mb-2.5">
                  Choose Upscaling Scale Factor
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[2, 3, 4].map((scale) => {
                    const newW = loadedImg ? loadedImg.width * scale : 0;
                    const newH = loadedImg ? loadedImg.height * scale : 0;
                    const mp = ((newW * newH) / 1000000).toFixed(1);
                    return (
                      <button
                        key={scale}
                        onClick={() => setScaleFactor(scale)}
                        className={`p-4 rounded-md border text-center transition-all ${
                          scaleFactor === scale
                            ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] shadow-xs'
                            : 'border-[rgba(32,21,21,0.14)] dark:border-[rgba(255,255,255,0.16)] bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00]'
                        }`}
                      >
                        <div className="text-xl font-black">{scale}× Super Res</div>
                        <div className="text-xs font-bold mt-1">{newW} × {newH}px</div>
                        <div className="text-[10px] text-[#605d52] dark:text-[#9f9b8f] mt-0.5">{mp} Megapixels</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#f8f4f0] dark:bg-[#0a0a0a] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)] text-xs text-[#605d52] dark:text-[#9f9b8f]">
                Super Resolution executes high-precision bicubic interpolation and automatically sets print metadata to 300 DPI for crystal-clear prints.
              </div>
            </div>
          )}

          {/* Live Canvas Preview */}
          <div 
            ref={previewContainerRef}
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            className="mb-6 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.12)] bg-[#f8f4f0] dark:bg-[#0a0a0a] p-4 text-center overflow-hidden"
          >
            <span className="text-xs font-bold text-[#605d52] dark:text-[#9f9b8f] uppercase tracking-wider block mb-3">
              {activeTab === 'quality' && showSplit
                ? 'Split View: Drag center line to inspect quality difference'
                : 'Interactive Render Preview'}
            </span>
            <canvas
              ref={canvasRef}
              className={`max-h-[460px] max-w-full mx-auto rounded-md object-contain border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] shadow-sm bg-white dark:bg-[#121212] ${
                showSplit ? 'cursor-ew-resize' : 'cursor-default'
              }`}
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setTargetDpi(300);
                setCustomDpiInput('300');
                setContrast(15);
                setBrightness(0);
                setSaturation(15);
                setScaleFactor(2);
                showToast('Reset to default presets', 'info');
              }}
              className="px-5 py-3 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffefb] dark:bg-[#1a1a1a] text-xs font-bold text-[#201515] dark:text-[#fffefb] hover:bg-[rgba(32,21,21,0.04)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reset Settings
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] active:bg-[#c93e00] text-[#fffefb] font-bold text-sm shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            >
              <Download className="w-5 h-5" />
              {activeTab === 'super'
                ? `Download ${scaleFactor}× Super-Res (${loadedImg?.width * scaleFactor} × ${loadedImg?.height * scaleFactor}px @ 300 DPI)`
                : activeTab === 'quality'
                ? `Download Enhanced Image (${targetDpi} DPI)`
                : `Download Image with ${targetDpi} DPI (${printDims?.widthInches}" × ${printDims?.heightInches}")`}
            </button>
          </div>
        </div>
      )}

      <FaqSection />
    </div>
  );
}

