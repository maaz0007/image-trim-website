import React, { useState, useRef, useEffect } from 'react';
import { Scissors, RotateCcw, Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { downloadBlob } from '../utils/imageUtils';

export default function CropTool({ imageSrc, naturalWidth, naturalHeight, outputFormat = 'image/jpeg', onCropped }) {
  const { showToast } = useToast();
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [ratio, setRatio] = useState('free');
  const [dispSize, setDispSize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 20, y: 20, w: 200, h: 150 });
  const [dragging, setDragging] = useState(null);
  const startRef = useRef({});

  const handleImageLoad = () => {
    if (!imgRef.current) return;
    const w = imgRef.current.clientWidth;
    const h = imgRef.current.clientHeight;
    setDispSize({ w, h });
    setCrop({
      x: Math.round(w * 0.1),
      y: Math.round(h * 0.1),
      w: Math.round(w * 0.8),
      h: Math.round(h * 0.8),
    });
  };

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      handleImageLoad();
    }
  }, [imageSrc]);

  const parseRatio = (r) => {
    if (r === 'free' || !r) return null;
    if (typeof r === 'number') return r;
    if (r === '1:1') return 1;
    if (r === '4:3') return 4 / 3;
    if (r === '16:9') return 16 / 9;
    if (r === '3:2') return 3 / 2;
    const parts = r.split(':').map(Number);
    if (parts.length === 2 && parts[1] > 0) return parts[0] / parts[1];
    return null;
  };

  const applyRatio = (r) => {
    setRatio(r);
    const numRatio = parseRatio(r);
    if (numRatio && crop.w > 0) {
      const newH = Math.min(dispSize.h - crop.y, crop.w / numRatio);
      setCrop((prev) => ({ ...prev, h: Math.round(newH) }));
    }
  };

  const handleMouseDown = (e, handleType) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setDragging(handleType);
    startRef.current = { mx, my, ...crop };
  };

  const handleMouseMove = (e) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - startRef.current.mx;
    const dy = my - startRef.current.dy;

    const numRatio = parseRatio(ratio);

    if (dragging === 'move') {
      const maxX = dispSize.w - crop.w;
      const maxY = dispSize.h - crop.h;
      setCrop((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(maxX, startRef.current.x + dx)),
        y: Math.max(0, Math.min(maxY, startRef.current.y + dy)),
      }));
    } else {
      let { x, y, w, h } = startRef.current;
      if (dragging.includes('r')) w = Math.max(30, startRef.current.w + dx);
      if (dragging.includes('b')) h = Math.max(30, startRef.current.h + dy);
      if (dragging.includes('l')) {
        const newW = Math.max(30, startRef.current.w - dx);
        x = startRef.current.x + (startRef.current.w - newW);
        w = newW;
      }
      if (dragging.includes('t')) {
        const newH = Math.max(30, startRef.current.h - dy);
        y = startRef.current.y + (startRef.current.h - newH);
        h = newH;
      }

      if (numRatio) {
        h = Math.round(w / numRatio);
      }

      x = Math.max(0, Math.min(dispSize.w - 30, x));
      y = Math.max(0, Math.min(dispSize.h - 30, y));
      w = Math.min(dispSize.w - x, w);
      h = Math.min(dispSize.h - y, h);

      setCrop({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleReset = () => {
    setCrop({
      x: Math.round(dispSize.w * 0.1),
      y: Math.round(dispSize.h * 0.1),
      w: Math.round(dispSize.w * 0.8),
      h: Math.round(dispSize.h * 0.8),
    });
    setRatio('free');
  };

  const scaleX = naturalWidth && dispSize.w ? naturalWidth / dispSize.w : 1;
  const scaleY = naturalHeight && dispSize.h ? naturalHeight / dispSize.h : 1;
  const actualW = Math.round(crop.w * scaleX);
  const actualH = Math.round(crop.h * scaleY);

  const handleApplyCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = actualW;
    canvas.height = actualH;
    const ctx = canvas.getContext('2d');

    const sx = Math.round(crop.x * scaleX);
    const sy = Math.round(crop.y * scaleY);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, sx, sy, actualW, actualH, 0, 0, actualW, actualH);
      canvas.toBlob((blob) => {
        if (blob) {
          if (onCropped) {
            onCropped(blob, canvas.toDataURL(outputFormat, 0.95));
          } else {
            const ext = outputFormat.split('/')[1] || 'jpg';
            downloadBlob(blob, `cropped_${actualW}x${actualH}.${ext}`);
            showToast(`Cropped to ${actualW}×${actualH} px!`, 'success');
          }
        }
      }, outputFormat, 0.95);
    };
    img.src = imageSrc;
  };

  return (
    <div className="p-6 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] mt-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="font-primary text-base font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
          <Scissors className="w-4 h-4 text-[#ff4f00]" /> Interactive Visual Crop
        </h3>

        {/* Aspect Ratio Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {[
            { label: 'Free', val: 'free' },
            { label: '1:1', val: 1 },
            { label: '4:3', val: 4 / 3 },
            { label: '16:9', val: 16 / 9 },
            { label: '3:2', val: 3 / 2 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => applyRatio(item.val)}
              className={`px-3 py-1 rounded-full border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
                ratio === item.val
                  ? 'bg-[#201515] border-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:border-[#fffefb] dark:text-[#201515]'
                  : 'border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.18)] text-[#36342e] dark:text-[#a0a8c0] hover:border-[#201515]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cropper Workspace */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative inline-block max-w-full overflow-hidden select-none rounded-md border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] mx-auto bg-black/50"
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt="To crop"
          onLoad={handleImageLoad}
          className="max-h-[380px] max-w-full block object-contain pointer-events-none"
        />

        {/* Crop Selection Box */}
        {dispSize.w > 0 && (
          <div
            style={{
              left: `${crop.x}px`,
              top: `${crop.y}px`,
              width: `${crop.w}px`,
              height: `${crop.h}px`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move z-10 box-border"
          >
            {/* Grid overlay lines */}
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-dashed border-white/60"></div>
              <div className="border-r border-b border-dashed border-white/60"></div>
              <div className="border-b border-dashed border-white/60"></div>
              <div className="border-r border-b border-dashed border-white/60"></div>
              <div className="border-r border-b border-dashed border-white/60"></div>
              <div className="border-b border-dashed border-white/60"></div>
              <div className="border-r border-dashed border-white/60"></div>
              <div className="border-r border-dashed border-white/60"></div>
              <div></div>
            </div>

            {/* Corner & edge handles */}
            <div onMouseDown={(e) => handleMouseDown(e, 'tl')} className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#ff4f00] rounded-xs cursor-nw-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 'tr')} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#ff4f00] rounded-xs cursor-ne-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 'bl')} className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#ff4f00] rounded-xs cursor-sw-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 'br')} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#ff4f00] rounded-xs cursor-se-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 't')} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-[#ff4f00] rounded-xs cursor-n-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 'b')} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-[#ff4f00] rounded-xs cursor-s-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 'l')} className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#ff4f00] rounded-xs cursor-w-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 'r')} className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#ff4f00] rounded-xs cursor-e-resize" />
          </div>
        )}
      </div>

      {/* Info & Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)]">
        <div className="text-xs text-[#605d52] dark:text-[#a0a8c0] font-semibold">
          Crop Selection: <strong className="text-[#201515] dark:text-[#fffefb]">{actualW} × {actualH} px</strong>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(32,21,21,0.04)] dark:hover:bg-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#201515] dark:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleApplyCrop}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] text-white text-xs font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none"
          >
            <Scissors className="w-3.5 h-3.5" /> Crop & Download
          </button>
        </div>
      </div>
    </div>
  );
}
