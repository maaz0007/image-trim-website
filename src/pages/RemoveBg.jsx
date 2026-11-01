import React, { useState, useEffect, useRef, useCallback } from 'react';
import UploadZone from '../components/UploadZone';
import FaqSection from '../components/FaqSection';
import { readFile, loadImage, fmtBytes, downloadBlob } from '../utils/imageUtils';
import { useToast } from '../context/ToastContext';
import { 
  Sparkles, Download, X, Wand2, Eraser, Paintbrush, 
  Sliders, RefreshCw, Eye, Scissors, Layers, Check,
  FlipHorizontal, Loader2, Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { removeBackground } from '@imgly/background-removal';

export default function RemoveBg() {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadedImg, setLoadedImg] = useState(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Result state
  const [cutoutImg, setCutoutImg] = useState(null); // Image element of the AI-cutout
  const [cutoutBlob, setCutoutBlob] = useState(null);

  // Settings
  const [bgMode, setBgMode] = useState('transparent'); // 'transparent' | 'white' | 'black' | 'shadow' | 'custom'
  const [customBgColor, setCustomBgColor] = useState('#ff4f00');
  const [compareMode, setCompareMode] = useState(false);
  const [splitPos, setSplitPos] = useState(50); // percentage for split view

  // Manual Touch-Up Brushes (applied on top of cutout)
  const [activeTool, setActiveTool] = useState('view'); // 'view' | 'erase' | 'restore'
  const [brushSize, setBrushSize] = useState(25);

  // Canvases
  const previewCanvasRef = useRef(null);
  const touchUpCanvasRef = useRef(null); // stores user manual erase/restore overlay
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);

  // Run AI Background Removal
  const processImageWithAI = async (file, img) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setProcessStatus('Initializing AI Neural Network...');

    try {
      const config = {
        model: 'isnet_fp16', // High accuracy IS-Net model
        device: 'gpu', // WebGPU/WebGL accelerated with CPU WASM fallback
        proxyToWorker: true,
        output: {
          format: 'image/png',
          quality: 0.95,
        },
        progress: (key, current, total) => {
          if (total > 0) {
            const p = Math.round((current / total) * 100);
            setProgressPercent(p);
            if (key.includes('fetch')) {
              setProcessStatus(`Downloading AI Model (${p}%)...`);
            } else if (key.includes('compute') || key.includes('onnx')) {
              setProcessStatus(`AI Isolating Subject (${p}%)...`);
            } else {
              setProcessStatus(`Processing (${p}%)...`);
            }
          }
        },
      };

      setProcessStatus('AI Detecting & Segmenting Subject...');
      const resultBlob = await removeBackground(file, config);
      setCutoutBlob(resultBlob);

      const cutoutUrl = URL.createObjectURL(resultBlob);
      const cImg = await loadImage(cutoutUrl);
      setCutoutImg(cImg);

      // Initialize touchup overlay canvas matching cutout size
      const tCanvas = document.createElement('canvas');
      tCanvas.width = cImg.width;
      tCanvas.height = cImg.height;
      touchUpCanvasRef.current = tCanvas;

      setIsProcessing(false);
      setProgressPercent(100);
      setProcessStatus('Done!');
      showToast('AI background removed with remove.bg precision!', 'success');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    } catch (err) {
      console.warn('AI Model acceleration error, retrying with CPU configuration:', err);
      try {
        // Fallback to CPU WASM
        setProcessStatus('Running on CPU WASM engine...');
        const cpuBlob = await removeBackground(file, {
          device: 'cpu',
          model: 'isnet_quint8',
          proxyToWorker: false,
          output: { format: 'image/png' },
          progress: (key, current, total) => {
            if (total > 0) {
              setProgressPercent(Math.round((current / total) * 100));
            }
          }
        });
        setCutoutBlob(cpuBlob);
        const cImg = await loadImage(URL.createObjectURL(cpuBlob));
        setCutoutImg(cImg);

        const tCanvas = document.createElement('canvas');
        tCanvas.width = cImg.width;
        tCanvas.height = cImg.height;
        touchUpCanvasRef.current = tCanvas;

        setIsProcessing(false);
        showToast('Background removed successfully!', 'success');
      } catch (cpuErr) {
        console.error('AI Background Removal error:', cpuErr);
        setIsProcessing(false);
        showToast('Unable to complete AI removal. Please check your internet connection for initial model download.', 'error');
      }
    }
  };

  // Handle Files Selected
  const handleFilesSelected = async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      const src = await readFile(file);
      const img = await loadImage(src);
      setLoadedImg(img);
      setCutoutImg(null);
      setCutoutBlob(null);

      // Immediately run AI Background Removal
      await processImageWithAI(file, img);
    } catch (err) {
      showToast('Failed to load image file.', 'error');
    }
  };

  /**
   * Render composite onto display canvas
   */
  const renderComposite = useCallback(() => {
    if (!loadedImg || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = loadedImg.width;
    const h = loadedImg.height;

    // Responsive preview scaling
    const containerWidth = canvas.parentElement?.clientWidth || 700;
    const maxW = Math.min(containerWidth, w);
    const scale = maxW / w;
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);

    canvas.width = dw;
    canvas.height = dh;

    // If still processing or no cutout yet, render original with a subtle dim
    if (!cutoutImg) {
      ctx.drawImage(loadedImg, 0, 0, dw, dh);
      return;
    }

    // 1. Prepare Cutout Layer with user manual touch-ups
    const cutCanvas = document.createElement('canvas');
    cutCanvas.width = dw;
    cutCanvas.height = dh;
    const cCtx = cutCanvas.getContext('2d');

    // Draw AI cutout
    cCtx.drawImage(cutoutImg, 0, 0, dw, dh);

    // If user made manual touch-ups (erase/restore), apply them
    if (touchUpCanvasRef.current) {
      cCtx.drawImage(touchUpCanvasRef.current, 0, 0, dw, dh);
    }

    // 2. Handle Split Comparison View vs Normal Cutout
    if (compareMode) {
      // Draw original image on entire canvas
      ctx.drawImage(loadedImg, 0, 0, dw, dh);

      const splitX = Math.round((splitPos / 100) * dw);

      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, dw - splitX, dh);
      ctx.clip();

      // In clipped region, draw selected background
      if (bgMode === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(splitX, 0, dw - splitX, dh);
      } else if (bgMode === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(splitX, 0, dw - splitX, dh);
      } else if (bgMode === 'custom') {
        ctx.fillStyle = customBgColor;
        ctx.fillRect(splitX, 0, dw - splitX, dh);
      } else {
        // Transparent: clear to show checkerboard
        ctx.clearRect(splitX, 0, dw - splitX, dh);
      }

      // Draw Cutout in clipped region
      ctx.drawImage(cutCanvas, 0, 0);
      ctx.restore();

      // Divider Line
      ctx.strokeStyle = '#ff4f00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, dh);
      ctx.stroke();

      // Handle circle
      ctx.fillStyle = '#ff4f00';
      ctx.beginPath();
      ctx.arc(splitX, dh / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(splitX, dh / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // 3. Normal View: Draw Background + Cutout
    ctx.clearRect(0, 0, dw, dh);

    if (bgMode === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, dw, dh);
    } else if (bgMode === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, dw, dh);
    } else if (bgMode === 'custom') {
      ctx.fillStyle = customBgColor;
      ctx.fillRect(0, 0, dw, dh);
    } else if (bgMode === 'shadow') {
      // White studio with soft ambient contact shadow
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, dw, dh);
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 12;
      ctx.drawImage(cutCanvas, 0, 0);
      ctx.restore();
    }

    // Draw Cutout
    ctx.drawImage(cutCanvas, 0, 0);
  }, [loadedImg, cutoutImg, bgMode, customBgColor, compareMode, splitPos]);

  useEffect(() => {
    renderComposite();
  }, [renderComposite]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => renderComposite();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderComposite]);

  /**
   * Coordinate calculation
   */
  const getImageCoords = (e) => {
    if (!previewCanvasRef.current || !loadedImg) return null;
    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return {
      x: Math.round(normX * loadedImg.width),
      y: Math.round(normY * loadedImg.height),
      normX,
      normY
    };
  };

  /**
   * Pointer Events for Split Compare & Manual Brush
   */
  const handlePointerDown = (e) => {
    const coords = getImageCoords(e);
    if (!coords) return;

    if (compareMode) {
      setSplitPos(Math.round(coords.normX * 100));
      isDrawingRef.current = true;
      return;
    }

    if (activeTool === 'erase' || activeTool === 'restore') {
      isDrawingRef.current = true;
      lastPointRef.current = { x: coords.x, y: coords.y };
      applyBrushStroke(coords.x, coords.y, coords.x, coords.y);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const coords = getImageCoords(e);
    if (!coords) return;

    if (compareMode) {
      setSplitPos(Math.round(coords.normX * 100));
      return;
    }

    if (activeTool === 'erase' || activeTool === 'restore') {
      if (lastPointRef.current) {
        applyBrushStroke(lastPointRef.current.x, lastPointRef.current.y, coords.x, coords.y);
      }
      lastPointRef.current = { x: coords.x, y: coords.y };
    }
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  /**
   * Apply Brush Stroke
   */
  const applyBrushStroke = (x1, y1, x2, y2) => {
    if (!touchUpCanvasRef.current) return;
    const tCtx = touchUpCanvasRef.current.getContext('2d');
    tCtx.save();
    tCtx.lineCap = 'round';
    tCtx.lineJoin = 'round';
    tCtx.lineWidth = brushSize * 2;

    if (activeTool === 'erase') {
      // Erase removes pixels from cutout
      tCtx.globalCompositeOperation = 'destination-out';
      tCtx.strokeStyle = 'rgba(0,0,0,1)';
      tCtx.beginPath();
      tCtx.moveTo(x1, y1);
      tCtx.lineTo(x2, y2);
      tCtx.stroke();
    } else if (activeTool === 'restore' && loadedImg) {
      // Restore paints original image pixels back
      tCtx.globalCompositeOperation = 'source-over';
      // Create pattern from original image
      const pat = tCtx.createPattern(loadedImg, 'no-repeat');
      if (pat) {
        tCtx.strokeStyle = pat;
        tCtx.beginPath();
        tCtx.moveTo(x1, y1);
        tCtx.lineTo(x2, y2);
        tCtx.stroke();
      }
    }
    tCtx.restore();

    renderComposite();
  };

  /**
   * Re-run AI Removal
   */
  const handleReRunAI = () => {
    if (selectedFile && loadedImg) {
      processImageWithAI(selectedFile, loadedImg);
    }
  };

  /**
   * Download Cutout
   */
  const handleDownload = () => {
    if (!cutoutImg || !loadedImg) return;

    const w = loadedImg.width;
    const h = loadedImg.height;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d');

    // 1. Draw Background
    if (bgMode === 'white') {
      outCtx.fillStyle = '#ffffff';
      outCtx.fillRect(0, 0, w, h);
    } else if (bgMode === 'black') {
      outCtx.fillStyle = '#000000';
      outCtx.fillRect(0, 0, w, h);
    } else if (bgMode === 'custom') {
      outCtx.fillStyle = customBgColor;
      outCtx.fillRect(0, 0, w, h);
    } else if (bgMode === 'shadow') {
      outCtx.fillStyle = '#f8f9fa';
      outCtx.fillRect(0, 0, w, h);
      outCtx.save();
      outCtx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      outCtx.shadowBlur = 35;
      outCtx.shadowOffsetY = 16;
      outCtx.drawImage(cutoutImg, 0, 0, w, h);
      outCtx.restore();
    }

    // 2. Draw Cutout Layer
    outCtx.drawImage(cutoutImg, 0, 0, w, h);

    // 3. Draw Touch-ups if any
    if (touchUpCanvasRef.current) {
      outCtx.drawImage(touchUpCanvasRef.current, 0, 0, w, h);
    }

    const isTransparent = bgMode === 'transparent';
    const mime = isTransparent ? 'image/png' : 'image/jpeg';
    const ext = isTransparent ? 'png' : 'jpg';

    outCanvas.toBlob((blob) => {
      if (blob) {
        const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'cutout';
        downloadBlob(blob, `${baseName}_removebg.${ext}`);
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.8 } });
        showToast(`AI Cutout downloaded (${ext.toUpperCase()})!`, 'success');
      }
    }, mime, 0.95);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setLoadedImg(null);
    setCutoutImg(null);
    setCutoutBlob(null);
    showToast('Image cleared', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e3f2fd] text-[#1976d2] dark:bg-[#1565c0]/30 dark:text-[#90caf9] border border-[#90caf9]/50 shadow-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#ff4f00]" /> AI Deep Neural Segmentation
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#201515] dark:text-[#fffefb] mb-3">
          Remove <span className="text-[#ff4f00]">Background</span>
        </h1>
        <p className="text-sm sm:text-base text-[#605d52] dark:text-[#9f9b8f]">
          100% automatic AI background removal directly in your browser. Powered by deep neural networks with remove.bg precision for cars, people, products, and graphics.
        </p>
      </div>

      {!selectedFile ? (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          title="Drop image to remove background automatically"
          subtitle="Supports JPG, PNG, WEBP, AVIF with state-of-the-art AI subject isolation"
        />
      ) : (
        <div className="p-6 sm:p-8 rounded-lg sm:rounded-xl border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm animate-fade-up">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7cb342] flex items-center justify-center text-white shadow-xs">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#201515] dark:text-[#fffefb]">
                  {selectedFile.name}
                </h3>
                <span className="text-xs text-[#605d52] dark:text-[#9f9b8f]">
                  {fmtBytes(selectedFile.size)} · {loadedImg?.width} × {loadedImg?.height}px
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareMode(!compareMode)}
                disabled={!cutoutImg}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:opacity-50 ${
                  compareMode
                    ? 'bg-[#201515] text-[#fffefb] border-[#201515] dark:bg-[#fffefb] dark:text-[#201515]'
                    : 'border-[rgba(32,21,21,0.15)] text-[#201515] dark:text-[#fffefb] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{compareMode ? 'Exit Comparison' : 'Split Comparison'}</span>
              </button>

              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>

          {/* AI Progress Notification Banner */}
          {isProcessing && (
            <div className="mb-6 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40">
              <div className="flex items-center justify-between text-xs font-bold text-[#ff4f00] mb-2">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#ff4f00]" />
                  <span>{processStatus || 'AI Neural Processing...'}</span>
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-orange-200/60 dark:bg-orange-900/40 overflow-hidden">
                <div
                  style={{ width: `${Math.max(8, progressPercent)}%` }}
                  className="h-full bg-[#ff4f00] transition-all duration-300"
                />
              </div>
              <span className="text-[11px] text-[#605d52] dark:text-[#9f9b8f] mt-1.5 block">
                Model executes locally on client hardware via WebGPU / WebAssembly. Zero data leaves your computer.
              </span>
            </div>
          )}

          {/* Controls Bar: Replacement Backgrounds & Manual Touch Up */}
          {cutoutImg && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 p-4 rounded-lg bg-[#f8f4f0] dark:bg-[#0a0a0a] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)]">
              
              {/* Background Replacement */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] block mb-2">
                  Replace Background Backdrop
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setBgMode('transparent')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      bgMode === 'transparent'
                        ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] font-bold'
                        : 'border-[rgba(32,21,21,0.15)] bg-white dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb]'
                    }`}
                  >
                    Transparent (PNG)
                  </button>

                  <button
                    onClick={() => setBgMode('white')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      bgMode === 'white'
                        ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] font-bold'
                        : 'border-[rgba(32,21,21,0.15)] bg-white dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb]'
                    }`}
                  >
                    White
                  </button>

                  <button
                    onClick={() => setBgMode('black')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      bgMode === 'black'
                        ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] font-bold'
                        : 'border-[rgba(32,21,21,0.15)] bg-white dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb]'
                    }`}
                  >
                    Black
                  </button>

                  <button
                    onClick={() => setBgMode('shadow')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      bgMode === 'shadow'
                        ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] font-bold'
                        : 'border-[rgba(32,21,21,0.15)] bg-white dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb]'
                    }`}
                    title="Adds natural contact drop shadow under cars and objects"
                  >
                    Studio Shadow
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setBgMode('custom')}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        bgMode === 'custom'
                          ? 'border-[#ff4f00] bg-[#ff4f00]/10 text-[#ff4f00] font-bold'
                          : 'border-[rgba(32,21,21,0.15)] bg-white dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb]'
                      }`}
                    >
                      Color
                    </button>
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => {
                        setCustomBgColor(e.target.value);
                        setBgMode('custom');
                      }}
                      className="w-7 h-7 rounded cursor-pointer border border-[rgba(32,21,21,0.15)] bg-transparent p-0.5"
                      title="Choose custom background color"
                    />
                  </div>
                </div>
              </div>

              {/* Manual Touch-up Tools */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#605d52] dark:text-[#9f9b8f] block mb-2">
                  Optional Fine Touch-Up
                </span>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <button
                    onClick={() => setActiveTool('view')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      activeTool === 'view'
                        ? 'bg-[#201515] text-white border-[#201515] dark:bg-white dark:text-black dark:border-white shadow-xs'
                        : 'border-[rgba(32,21,21,0.15)] bg-white dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb]'
                    }`}
                  >
                    View Only
                  </button>

                  <button
                    onClick={() => setActiveTool('erase')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      activeTool === 'erase'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'border-[rgba(32,21,21,0.15)] bg-white dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb]'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" /> Erase Brush
                  </button>

                  <button
                    onClick={() => setActiveTool('restore')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      activeTool === 'restore'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'border-[rgba(32,21,21,0.15)] bg-white dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb]'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" /> Restore Brush
                  </button>
                </div>

                {(activeTool === 'erase' || activeTool === 'restore') && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-semibold text-[#605d52] dark:text-[#9f9b8f]">
                      Brush Size: {brushSize}px
                    </span>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-32 h-1.5 accent-[#ff4f00]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Canvas Render Area with Checkerboard Backdrop */}
          <div className="mb-6 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.12)] p-4 text-center overflow-hidden relative">
            <span className="text-xs font-bold text-[#605d52] dark:text-[#9f9b8f] uppercase tracking-wider block mb-3">
              {compareMode
                ? 'Split View: Drag center line to compare original vs AI cutout'
                : activeTool === 'erase'
                ? 'Erase Mode: Drag mouse to remove unwanted spots'
                : activeTool === 'restore'
                ? 'Restore Mode: Drag mouse to paint back original details'
                : isProcessing
                ? 'Neural Network Processing...'
                : 'AI Isolated Cutout'}
            </span>

            {/* Checkerboard Container */}
            <div
              className="inline-block mx-auto rounded-md border border-[rgba(32,21,21,0.14)] dark:border-[rgba(255,255,255,0.16)] shadow-sm max-w-full overflow-hidden select-none"
              style={{
                backgroundImage:
                  bgMode === 'transparent'
                    ? 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)'
                    : 'none',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                backgroundColor: bgMode === 'transparent' ? '#ffffff' : 'transparent',
              }}
            >
              <canvas
                ref={previewCanvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className={`max-h-[500px] max-w-full mx-auto block ${
                  compareMode
                    ? 'cursor-ew-resize'
                    : activeTool === 'erase' || activeTool === 'restore'
                    ? 'cursor-pointer'
                    : 'cursor-default'
                }`}
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleReRunAI}
              disabled={isProcessing}
              className="px-5 py-3 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffefb] dark:bg-[#1a1a1a] text-xs font-bold text-[#201515] dark:text-[#fffefb] hover:bg-[rgba(32,21,21,0.04)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} /> Re-process AI
            </button>

            <button
              onClick={handleDownload}
              disabled={!cutoutImg || isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] active:bg-[#c93e00] text-[#fffefb] font-bold text-sm shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00] disabled:opacity-50"
            >
              <Download className="w-5 h-5" /> Download Cutout ({bgMode === 'transparent' ? 'Transparent PNG' : `${bgMode.toUpperCase()} Background`})
            </button>
          </div>
        </div>
      )}

      <FaqSection />
    </div>
  );
}
