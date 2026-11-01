import React, { useRef, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function UploadZone({ 
  onFilesSelected, 
  multiple = false, 
  accept = "image/*", 
  title = "Drop image here or click to add", 
  subtitle = "Supports JPG, PNG, WEBP, GIF, BMP, TIFF, SVG, AVIF",
  hint = "📋 Or paste with Ctrl+V",
  enablePaste = true
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!enablePaste) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        showToast('Image pasted from clipboard!', 'success');
        onFilesSelected(multiple ? files : [files[0]]);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [enablePaste, multiple, onFilesSelected, showToast]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(multiple ? droppedFiles : [droppedFiles[0]]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(multiple ? selectedFiles : [selectedFiles[0]]);
      e.target.value = '';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative rounded-lg border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${
        isDragOver
          ? 'border-[#ff4f00] bg-[rgba(255,79,0,0.06)] scale-[1.005]'
          : 'border-[rgba(32,21,21,0.18)] dark:border-[rgba(255,255,255,0.2)] bg-white dark:bg-[#121212] hover:border-[#ff4f00] hover:bg-[#fffdf9] dark:hover:bg-[#161616]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      {/* Decorative center icon bubble */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-xl bg-[#f8f4f0] dark:bg-[#1f1f1f] border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.15)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <Upload className="w-6 h-6 text-[#ff4f00] transition-transform duration-200 group-hover:-translate-y-0.5" />
      </div>

      <h3 className="font-primary text-base sm:text-lg font-bold tracking-tight text-[#201515] dark:text-[#fffefb] mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#605d52] dark:text-[#a0a8c0] max-w-md mx-auto mb-3 font-normal">
        {subtitle}
      </p>

      {hint && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f8f4f0] dark:bg-[#1a1a1a] text-[#36342e] dark:text-[#fffefb] border border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.15)]">
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}
