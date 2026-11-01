import React, { useState } from 'react';
import UploadZone from '../components/UploadZone';
import FaqSection from '../components/FaqSection';
import { 
  imagesToPdf, pdfToImages, mergePdfs, splitPdf, compressPdf, getPdfInfo 
} from '../utils/pdfUtils';
import { fmtBytes, downloadBlob } from '../utils/imageUtils';
import { useToast } from '../context/ToastContext';
import JSZip from 'jszip';
import { 
  FileText, Download, X, Layers, 
  FilePlus, Split, Image as ImageIcon, CheckCircle2,
  Archive, Sparkles, SlidersHorizontal, Gauge, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const PDF_TOOLS = [
  { id: 'compress-pdf', label: 'Compress PDF', icon: Archive, desc: 'Shrink PDF file size up to 80% with crisp document quality' },
  { id: 'img-to-pdf', label: 'Images to PDF', icon: FilePlus, desc: 'Combine multiple JPG, PNG, WEBP images into a PDF' },
  { id: 'pdf-to-img', label: 'PDF to Images', icon: ImageIcon, desc: 'Extract all pages of a PDF into high-res JPG or PNG' },
  { id: 'merge', label: 'Merge PDF', icon: Layers, desc: 'Combine 2 or more PDF documents into one' },
  { id: 'split', label: 'Split PDF', icon: Split, desc: 'Split a multi-page PDF into separate single-page files' },
];

export default function PdfPage() {
  const { showToast } = useToast();
  const [activeTool, setActiveTool] = useState('compress-pdf');
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Settings for Images to PDF
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [quality, setQuality] = useState(0.95);
  const [extractFormat, setExtractFormat] = useState('image/jpeg');

  // Settings for Compress PDF
  const [compressLevel, setCompressLevel] = useState('recommended'); // 'recommended' | 'extreme' | 'low' | 'custom'
  const [customReduction, setCustomReduction] = useState(65); // target size reduction percent (10% to 90%)
  const [targetSizeKB, setTargetSizeKB] = useState(null);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [compressResult, setCompressResult] = useState(null);
  const [compressProgress, setCompressProgress] = useState({ percent: 0, currentPage: 0, totalPages: 0, stage: '' });

  // Results
  const [extractedImages, setExtractedImages] = useState([]);
  const [splitResults, setSplitResults] = useState([]);

  const getEstimatedTargetBytes = () => {
    if (!files[0]) return 0;
    const rawTarget = targetSizeKB
      ? targetSizeKB * 1024
      : Math.round(files[0].size * (1 - customReduction / 100));

    // If fast probe determined that the document naturally reaches a maximum quality ceiling below rawTarget
    if (pdfMeta && pdfMeta.maxPossibleBytes && rawTarget > pdfMeta.maxPossibleBytes) {
      return pdfMeta.maxPossibleBytes;
    }

    return Math.max(1024, rawTarget);
  };

  const handleToolChange = (toolId) => {
    setActiveTool(toolId);
    setFiles([]);
    setExtractedImages([]);
    setSplitResults([]);
    setCompressResult(null);
    setCompressProgress({ percent: 0, currentPage: 0, totalPages: 0, stage: '' });
    setTargetSizeKB(null);
    setPdfMeta(null);
  };

  const handleFilesSelected = async (newFiles) => {
    if (!newFiles.length) return;
    setFiles(newFiles);
    setExtractedImages([]);
    setSplitResults([]);
    setCompressResult(null);
    setCompressProgress({ percent: 0, currentPage: 0, totalPages: 0, stage: '' });
    setTargetSizeKB(null);
    setPdfMeta(null);
    showToast(`${newFiles.length} file(s) selected`, 'success');

    if (newFiles[0] && (newFiles[0].type === 'application/pdf' || newFiles[0].name.toLowerCase().endsWith('.pdf'))) {
      try {
        const meta = await getPdfInfo(newFiles[0]);
        setPdfMeta(meta);
      } catch (err) {
        console.warn('PDF metadata read error:', err);
      }
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setCompressResult(null);
    setTargetSizeKB(null);
    setPdfMeta(null);
  };

  const handleProcess = async () => {
    if (!files.length) {
      showToast('Please select files first!', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      if (activeTool === 'compress-pdf') {
        const targetBytes = getEstimatedTargetBytes();
        const result = await compressPdf(files[0], {
          level: compressLevel,
          reductionPercent: customReduction,
          targetBytes: targetBytes,
          onProgress: (percent, current, total, stage) => {
            setCompressProgress({
              percent,
              currentPage: current,
              totalPages: total,
              stage: stage || `Processing page ${current} of ${total}...`,
            });
          },
        });
        setCompressResult(result);
        downloadBlob(result.blob, `compressed_${files[0].name.replace(/\.[^.]+$/, '')}.pdf`);
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
        showToast(`Compressed by ${result.savingsPercent}%! PDF downloaded successfully.`, 'success');
      } else if (activeTool === 'img-to-pdf') {
        const blob = await imagesToPdf(files, { pageSize, orientation, quality });
        downloadBlob(blob, 'imagetrim_document.pdf');
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
        showToast('PDF created and downloaded successfully!', 'success');
      } else if (activeTool === 'pdf-to-img') {
        const results = await pdfToImages(files[0], { format: extractFormat, scale: 2.0 });
        setExtractedImages(results);
        showToast(`Extracted ${results.length} page(s)!`, 'success');
      } else if (activeTool === 'merge') {
        if (files.length < 2) {
          showToast('Please upload at least 2 PDF files to merge.', 'error');
          setIsProcessing(false);
          return;
        }
        const mergedBlob = await mergePdfs(files);
        downloadBlob(mergedBlob, 'merged_document.pdf');
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
        showToast('PDF files merged and downloaded!', 'success');
      } else if (activeTool === 'split') {
        const results = await splitPdf(files[0]);
        setSplitResults(results);
        showToast(`Split into ${results.length} single page files!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error processing: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAllExtracted = async () => {
    if (!extractedImages.length) return;
    const zip = new JSZip();
    const ext = extractFormat === 'image/png' ? 'png' : 'jpg';

    extractedImages.forEach((img) => {
      zip.file(`page_${img.pageNumber}.${ext}`, img.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'extracted_pdf_pages.zip');
    showToast('All pages downloaded as ZIP!', 'success');
  };

  const downloadAllSplit = async () => {
    if (!splitResults.length) return;
    const zip = new JSZip();

    splitResults.forEach((item) => {
      zip.file(`page_${item.pageNumber}.pdf`, item.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'split_pdf_pages.zip');
    showToast('All split pages downloaded as ZIP!', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="font-primary text-3xl sm:text-5xl font-extrabold tracking-tight mb-2 text-[#201515] dark:text-[#fffefb]">
          PDF <span className="text-[#ff4f00]">Power Suite</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#605d52] dark:text-[#a0a8c0]">
          Compress PDF file size, convert images to PDF, extract high-res pages, merge documents, and split pages with 100% client-side privacy.
        </p>
      </div>

      {/* Tool Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-8">
        {PDF_TOOLS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleToolChange(t.id)}
              className={`p-3.5 rounded-lg border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
                isActive
                  ? 'border-[#ff4f00] bg-[rgba(255,79,0,0.08)] shadow-sm text-[#201515] dark:text-[#fffefb]'
                  : 'border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] text-[#605d52] dark:text-[#a0a8c0] hover:border-[#201515]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#ff4f00]' : 'text-[#605d52] dark:text-[#a0a8c0]'}`} />
              <span className="font-primary text-xs sm:text-sm font-bold">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Upload Zone */}
      {files.length === 0 ? (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          multiple={activeTool === 'img-to-pdf' || activeTool === 'merge'}
          accept={activeTool === 'img-to-pdf' ? 'image/*' : 'application/pdf'}
          title={
            activeTool === 'img-to-pdf'
              ? 'Drop images for PDF (multi-select OK)'
              : activeTool === 'merge'
              ? 'Drop 2 or more PDF files to merge'
              : activeTool === 'compress-pdf'
              ? 'Drop PDF file to compress'
              : 'Drop PDF file here'
          }
          subtitle={
            activeTool === 'img-to-pdf'
              ? 'Each image becomes one page in your generated PDF'
              : activeTool === 'compress-pdf'
              ? 'Shrink PDF file size up to 80% while maintaining crisp document quality'
              : '100% private, processed in browser'
          }
        />
      ) : (
        <div className="p-6 sm:p-8 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)] flex-wrap gap-3">
            <h3 className="font-primary text-base sm:text-lg font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ff4f00]" />
              {files.length} File(s) Selected
            </h3>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setCompressResult(null);
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            >
              <X className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          {/* Settings Grid for Compress PDF */}
          {activeTool === 'compress-pdf' && (
            <div className="space-y-5 mb-6">
              {/* Preset Selector */}
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff4f00]" />
                    Compression Level Presets
                  </label>
                  <span className="text-xs font-bold text-[#ff4f00] bg-[rgba(255,79,0,0.08)] dark:bg-[rgba(255,79,0,0.18)] px-2.5 py-0.5 rounded-full">
                    {customReduction}% Target Reduction
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSizeKB(null);
                      setCompressLevel('recommended');
                      setCustomReduction(65);
                    }}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      compressLevel === 'recommended' && !targetSizeKB
                        ? 'border-[#ff4f00] bg-[rgba(255,79,0,0.08)] text-[#201515] dark:text-[#fffefb] shadow-xs'
                        : 'border-[rgba(32,21,21,0.14)] dark:border-[rgba(255,255,255,0.16)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#605d52] dark:text-[#a0a8c0] hover:border-[#ff4f00]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#ff4f00]">Recommended</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">~65% Less</span>
                    </div>
                    <div className="text-sm font-bold text-[#201515] dark:text-[#fffefb]">Balanced</div>
                    <p className="text-[11px] text-[#605d52] dark:text-[#a0a8c0] mt-1 leading-normal">
                      Crisp text, optimized images.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetSizeKB(null);
                      setCompressLevel('extreme');
                      setCustomReduction(85);
                    }}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      compressLevel === 'extreme' && !targetSizeKB
                        ? 'border-[#ff4f00] bg-[rgba(255,79,0,0.08)] text-[#201515] dark:text-[#fffefb] shadow-xs'
                        : 'border-[rgba(32,21,21,0.14)] dark:border-[rgba(255,255,255,0.16)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#605d52] dark:text-[#a0a8c0] hover:border-[#ff4f00]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#ff4f00]">Extreme</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">~85% Less</span>
                    </div>
                    <div className="text-sm font-bold text-[#201515] dark:text-[#fffefb]">Max Compression</div>
                    <p className="text-[11px] text-[#605d52] dark:text-[#a0a8c0] mt-1 leading-normal">
                      Smallest size for strict limits.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetSizeKB(null);
                      setCompressLevel('low');
                      setCustomReduction(35);
                    }}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      compressLevel === 'low' && !targetSizeKB
                        ? 'border-[#ff4f00] bg-[rgba(255,79,0,0.08)] text-[#201515] dark:text-[#fffefb] shadow-xs'
                        : 'border-[rgba(32,21,21,0.14)] dark:border-[rgba(255,255,255,0.16)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#605d52] dark:text-[#a0a8c0] hover:border-[#ff4f00]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#ff4f00]">Low</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">~35% Less</span>
                    </div>
                    <div className="text-sm font-bold text-[#201515] dark:text-[#fffefb]">High Quality Print</div>
                    <p className="text-[11px] text-[#605d52] dark:text-[#a0a8c0] mt-1 leading-normal">
                      High detail &amp; vector sharpness.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetSizeKB(null);
                      setCompressLevel('custom');
                    }}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      compressLevel === 'custom' || targetSizeKB
                        ? 'border-[#ff4f00] bg-[rgba(255,79,0,0.08)] text-[#201515] dark:text-[#fffefb] shadow-xs'
                        : 'border-[rgba(32,21,21,0.14)] dark:border-[rgba(255,255,255,0.16)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#605d52] dark:text-[#a0a8c0] hover:border-[#ff4f00]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#ff4f00]">Custom</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{customReduction}%</span>
                    </div>
                    <div className="text-sm font-bold text-[#201515] dark:text-[#fffefb]">Custom Range</div>
                    <p className="text-[11px] text-[#605d52] dark:text-[#a0a8c0] mt-1 leading-normal">
                      Exact slider progress control.
                    </p>
                  </button>
                </div>
              </div>

              {/* Custom Size Reduction Progress Bar / Slider Card */}
              <div className="p-4 sm:p-5 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-[#fffdf9] dark:bg-[#161616]">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-[#ff4f00]" />
                      Custom Size Reduction Slider Bar
                    </div>
                    <p className="text-[11px] text-[#605d52] dark:text-[#a0a8c0] mt-0.5">
                      Drag the progress bar to dial in the exact compression percentage &amp; target file size
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#ff4f00] font-primary">
                      {customReduction}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#605d52] dark:text-[#a0a8c0] block -mt-1 tracking-wider">
                      Size Reduction
                    </span>
                  </div>
                </div>

                {/* The Custom Interactive Slider Track */}
                <div className="relative mb-3">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="1"
                    value={customReduction}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTargetSizeKB(null);
                      setCustomReduction(val);
                      setCompressLevel('custom');
                    }}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-[#ff4f00] focus:outline-none transition-all"
                    style={{
                      background: `linear-gradient(to right, #ff4f00 0%, #ff4f00 ${((customReduction - 10) / 80) * 100}%, rgba(32,21,21,0.14) ${((customReduction - 10) / 80) * 100}%, rgba(32,21,21,0.14) 100%)`,
                    }}
                  />
                  {/* Preset Tick Points beneath slider */}
                  <div className="flex justify-between items-center text-[10px] font-semibold text-[#605d52] dark:text-[#a0a8c0] mt-1.5 px-0.5">
                    <button
                      type="button"
                      onClick={() => { setTargetSizeKB(null); setCustomReduction(20); setCompressLevel('custom'); }}
                      className={`hover:text-[#ff4f00] transition-colors ${customReduction === 20 && !targetSizeKB ? 'text-[#ff4f00] font-bold' : ''}`}
                    >
                      20% (Light)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTargetSizeKB(null); setCustomReduction(35); setCompressLevel('low'); }}
                      className={`hover:text-[#ff4f00] transition-colors ${customReduction === 35 && !targetSizeKB ? 'text-[#ff4f00] font-bold' : ''}`}
                    >
                      35% (Low)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTargetSizeKB(null); setCustomReduction(50); setCompressLevel('custom'); }}
                      className={`hover:text-[#ff4f00] transition-colors ${customReduction === 50 && !targetSizeKB ? 'text-[#ff4f00] font-bold' : ''}`}
                    >
                      50% (Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTargetSizeKB(null); setCustomReduction(65); setCompressLevel('recommended'); }}
                      className={`hover:text-[#ff4f00] transition-colors ${customReduction === 65 && !targetSizeKB ? 'text-[#ff4f00] font-bold' : ''}`}
                    >
                      65% (Balanced)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTargetSizeKB(null); setCustomReduction(85); setCompressLevel('extreme'); }}
                      className={`hover:text-[#ff4f00] transition-colors ${customReduction === 85 && !targetSizeKB ? 'text-[#ff4f00] font-bold' : ''}`}
                    >
                      85% (Extreme)
                    </button>
                  </div>
                </div>

                {/* Estimated Output Size & Quality Preview */}
                {files[0] && (() => {
                  const estTargetBytes = getEstimatedTargetBytes();
                  const estSavedBytes = Math.max(0, files[0].size - estTargetBytes);
                  const estSavingsPercent = Math.round((estSavedBytes / files[0].size) * 100);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)] text-xs">
                      <div className="p-2.5 rounded bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                        <span className="text-[10px] text-[#605d52] dark:text-[#a0a8c0] block uppercase font-bold tracking-wider">Original File Size</span>
                        <span className="text-xs sm:text-sm font-bold text-[#201515] dark:text-[#fffefb]">{fmtBytes(files[0].size)}</span>
                      </div>
                      <div className="p-2.5 rounded bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                        <span className="text-[10px] text-[#605d52] dark:text-[#a0a8c0] block uppercase font-bold tracking-wider">Estimated Output</span>
                        <span className="text-xs sm:text-sm font-bold text-[#ff4f00]">
                          ~{fmtBytes(estTargetBytes)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                        <span className="text-[10px] text-[#605d52] dark:text-[#a0a8c0] block uppercase font-bold tracking-wider">Estimated Savings</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          ~{estSavingsPercent}% (-{fmtBytes(estSavedBytes)})
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Target File Size Shortcuts */}
                {files[0] && (
                  <div className="mt-3 pt-2.5 border-t border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="text-[11px] font-semibold text-[#605d52] dark:text-[#a0a8c0]">
                      Quick Target Limits:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[150, 300, 500, 1024, 2048].map((targetKB) => {
                        const targetBytes = targetKB * 1024;
                        if (targetBytes >= files[0].size) return null;
                        const red = Math.min(90, Math.max(10, Math.round(((files[0].size - targetBytes) / files[0].size) * 100)));
                        const isSelected = targetSizeKB === targetKB;
                        return (
                          <button
                            key={targetKB}
                            type="button"
                            onClick={() => {
                              setTargetSizeKB(targetKB);
                              setCustomReduction(red);
                              setCompressLevel('custom');
                              showToast(`Target set to under ${targetKB >= 1024 ? `${targetKB / 1024} MB` : `${targetKB} KB`} (${red}% reduction)`, 'info');
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                              isSelected
                                ? 'border-[#ff4f00] bg-[rgba(255,79,0,0.12)] text-[#ff4f00] shadow-xs'
                                : 'border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-[#121212] text-[#201515] dark:text-[#fffefb] hover:border-[#ff4f00] hover:text-[#ff4f00]'
                            }`}
                          >
                            Under {targetKB >= 1024 ? `${targetKB / 1024} MB` : `${targetKB} KB`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Real-Time Execution Progress Bar during compression */}
              {isProcessing && (
                <div className="p-4 sm:p-5 rounded-lg bg-[rgba(255,79,0,0.05)] border border-[#ff4f00]/30 animate-fade-in shadow-xs">
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#ff4f00] animate-spin" />
                      {compressProgress.stage || `Compressing PDF pages (${compressProgress.currentPage} of ${compressProgress.totalPages})...`}
                    </span>
                    <span className="text-sm font-extrabold text-[#ff4f00] font-primary">
                      {compressProgress.percent}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[rgba(32,21,21,0.1)] dark:bg-[rgba(255,255,255,0.15)] overflow-hidden shadow-inner">
                    <div
                      style={{ width: `${compressProgress.percent}%` }}
                      className="h-full bg-gradient-to-r from-[#ff4f00] via-orange-500 to-amber-500 transition-all duration-300 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[#605d52] dark:text-[#a0a8c0] mt-2">
                    <span>Page {compressProgress.currentPage} of {compressProgress.totalPages || 1} processed</span>
                    <span>Applying {customReduction}% size reduction</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Grid for Images to PDF */}
          {activeTool === 'img-to-pdf' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                  Page Size
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
                >
                  <option value="a4">A4 (Standard 210 × 297 mm)</option>
                  <option value="a3">A3 (Large 297 × 420 mm)</option>
                  <option value="letter">US Letter (8.5 × 11 in)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                  Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
                >
                  <option value={0.95}>High (0.95)</option>
                  <option value={0.75}>Medium (0.75)</option>
                  <option value={0.5}>Compact (0.50)</option>
                </select>
              </div>
            </div>
          )}

          {/* Settings Grid for PDF to Images */}
          {activeTool === 'pdf-to-img' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#605d52] dark:text-[#a0a8c0] mb-2">
                  Image Extraction Format
                </label>
                <select
                  value={extractFormat}
                  onChange={(e) => setExtractFormat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffdf9] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] font-medium text-sm outline-none focus:border-[#ff4f00] focus:ring-1 focus:ring-[#ff4f00]"
                >
                  <option value="image/jpeg">JPG (Fast & Small)</option>
                  <option value="image/png">PNG (Lossless High Detail)</option>
                </select>
              </div>
            </div>
          )}

          {/* Uploaded File List / Thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="relative p-2.5 rounded-md border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-[#f8f4f0] dark:bg-[#1a1a1a] text-center flex flex-col justify-between group"
              >
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#201515] dark:bg-white text-white dark:text-[#201515] text-[10px] flex items-center justify-center font-bold shadow hover:scale-105 transition-transform"
                >
                  ✕
                </button>
                <div className="h-16 flex items-center justify-center mb-1">
                  <FileText className="w-8 h-8 text-[#ff4f00]" />
                </div>
                <div className="text-[11px] font-semibold text-[#201515] dark:text-[#fffefb] truncate">
                  {file.name}
                </div>
                <div className="text-[10px] text-[#605d52] dark:text-[#a0a8c0] font-normal">
                  {fmtBytes(file.size)}
                </div>
              </div>
            ))}
          </div>

          {/* Process Button */}
          <button
            type="button"
            onClick={handleProcess}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#ff4f00] hover:bg-[#e04500] text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
          >
            {isProcessing
              ? 'Processing PDF...'
              : activeTool === 'compress-pdf'
              ? `Compress PDF (${customReduction}% Reduction)`
              : `Execute ${PDF_TOOLS.find((t) => t.id === activeTool)?.label}`}
          </button>

          {/* Compressed Result Card */}
          {compressResult && (
            <div className="mt-6 p-4 sm:p-5 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-[#f8f4f0] dark:bg-[#1a1a1a] animate-fade-up">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#201515] dark:text-[#fffefb] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Compression Complete ({compressResult.pageCount} Pages)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                  ⚡ {compressResult.savingsPercent}% Smaller
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center my-3">
                <div className="p-2.5 rounded-md bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)]">
                  <span className="text-[11px] text-[#605d52] dark:text-[#a0a8c0] block">Original Size</span>
                  <span className="text-sm font-bold text-[#605d52] line-through block mt-0.5">
                    {fmtBytes(compressResult.originalSize)}
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)]">
                  <span className="text-[11px] text-[#605d52] dark:text-[#a0a8c0] block">Compressed Size</span>
                  <span className="text-sm font-extrabold text-[#ff4f00] block mt-0.5">
                    {fmtBytes(compressResult.compressedSize)}
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-white dark:bg-[#121212] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)] col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-[#605d52] dark:text-[#a0a8c0] block">Space Saved</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    -{fmtBytes(Math.max(0, compressResult.originalSize - compressResult.compressedSize))}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => downloadBlob(compressResult.blob, `compressed_${files[0]?.name.replace(/\.[^.]+$/, '') || 'document'}.pdf`)}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" /> Download Compressed PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Extracted Images Result Grid */}
      {extractedImages.length > 0 && (
        <div className="mt-8 p-6 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-primary text-base font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {extractedImages.length} Extracted Pages Ready
            </h3>
            <button
              type="button"
              onClick={downloadAllExtracted}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#201515] dark:bg-[#fffefb] text-[#fffefb] dark:text-[#201515] text-xs font-semibold shadow-sm transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            >
              <Download className="w-3.5 h-3.5" /> Download All as ZIP
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {extractedImages.map((img) => (
              <div key={img.pageNumber} className="p-3 rounded-md border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f8f4f0] dark:bg-[#181818] text-center">
                <img
                  src={img.dataUrl}
                  alt={`Page ${img.pageNumber}`}
                  className="rounded-sm max-h-40 mx-auto object-contain mb-2 border border-[rgba(32,21,21,0.08)] bg-white dark:bg-black"
                />
                <div className="text-xs font-semibold text-[#201515] dark:text-[#fffefb] mb-2">
                  Page {img.pageNumber} ({img.width}×{img.height})
                </div>
                <button
                  type="button"
                  onClick={() => downloadBlob(img.blob, `page_${img.pageNumber}.${extractFormat === 'image/png' ? 'png' : 'jpg'}`)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md border border-[rgba(32,21,21,0.2)] dark:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(32,21,21,0.05)] text-xs font-semibold text-[#201515] dark:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split Pages Result Grid */}
      {splitResults.length > 0 && (
        <div className="mt-8 p-6 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-primary text-base font-bold text-[#201515] dark:text-[#fffefb] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {splitResults.length} Single-Page Documents Ready
            </h3>
            <button
              type="button"
              onClick={downloadAllSplit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#201515] dark:bg-[#fffefb] text-[#fffefb] dark:text-[#201515] text-xs font-semibold shadow-sm transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            >
              <Download className="w-3.5 h-3.5" /> Download All as ZIP
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {splitResults.map((item) => (
              <div key={item.pageNumber} className="p-3 rounded-md border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f8f4f0] dark:bg-[#181818] text-center">
                <FileText className="w-8 h-8 text-[#ff4f00] mx-auto mb-1" />
                <div className="text-xs font-semibold mb-2 text-[#201515] dark:text-[#fffefb]">Page {item.pageNumber}.pdf</div>
                <button
                  type="button"
                  onClick={() => downloadBlob(item.blob, `page_${item.pageNumber}.pdf`)}
                  className="w-full flex items-center justify-center gap-1 py-1 rounded-md border border-[rgba(32,21,21,0.2)] dark:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(32,21,21,0.05)] text-[11px] font-semibold text-[#201515] dark:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
                >
                  <Download className="w-3 h-3" /> Save
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <FaqSection />
    </div>
  );
}
