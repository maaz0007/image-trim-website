import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { readFile, loadImage } from './imageUtils';

// Set worker for pdfjs
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Converts multiple image files into a single PDF
 */
export async function imagesToPdf(files, options = {}) {
  const { pageSize = 'a4', orientation = 'portrait', quality = 0.95 } = options;

  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < files.length; i++) {
    const src = await readFile(files[i]);
    const img = await loadImage(src);

    const ar = img.width / img.height;
    let iw = pw - 20;
    let ih = iw / ar;

    if (ih > ph - 20) {
      ih = ph - 20;
      iw = ih * ar;
    }

    if (i > 0) pdf.addPage();
    pdf.addImage(src, 'JPEG', (pw - iw) / 2, (ph - ih) / 2, iw, ih, undefined, 'FAST');
  }

  return pdf.output('blob');
}

/**
 * Extracts each page of a PDF file as image blobs
 */
export async function pdfToImages(pdfFile, options = {}) {
  const { format = 'image/jpeg', scale = 2.0, quality = 0.92 } = options;
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;

  const images = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise((res) => canvas.toBlob(res, format, quality));
    images.push({
      pageNumber: i,
      blob,
      width: canvas.width,
      height: canvas.height,
      dataUrl: canvas.toDataURL(format, quality),
    });
  }

  return images;
}

/**
 * Merges multiple PDF files into one
 */
export async function mergePdfs(pdfFiles) {
  const mergedPdf = await PDFDocument.create();

  for (const file of pdfFiles) {
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  return new Blob([mergedBytes], { type: 'application/pdf' });
}

/**
 * Splits a PDF file into individual pages or selected pages
 */
export async function splitPdf(pdfFile) {
  const fileBytes = await pdfFile.arrayBuffer();
  const sourcePdf = await PDFDocument.load(fileBytes);
  const numPages = sourcePdf.getPageCount();

  const splitBlobs = [];

  for (let i = 0; i < numPages; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
    newPdf.addPage(copiedPage);
    const pdfBytes = await newPdf.save();
    splitBlobs.push({
      pageNumber: i + 1,
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    });
  }

  return splitBlobs;
}

/**
 * Analyzes a PDF file to retrieve page count and calibrate compression potential
 * @param {File|Blob} pdfFile
 * @returns {Promise<{ numPages: number, maxPossibleBytes: number|null, isProbed: boolean }>}
 */
export async function getPdfInfo(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdfDoc.numPages;

    // Fast probe of first page at standard resolution (scale 1.75) to determine natural ceiling
    let maxPossibleBytes = null;
    try {
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.75 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      const topQualityBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.90));
      if (topQualityBlob) {
        const overhead = 1200 + 400 * numPages;
        maxPossibleBytes = Math.min(pdfFile.size, topQualityBlob.size * numPages + overhead);
      }
    } catch (err) {
      console.warn('Probe page render skipped:', err);
    }

    return {
      numPages,
      maxPossibleBytes,
      isProbed: true,
    };
  } catch (e) {
    console.warn('getPdfInfo error:', e);
    return { numPages: 1, maxPossibleBytes: null, isProbed: false };
  }
}

/**
 * Compresses a PDF file by rendering pages to optimized images and repacking streams.
 * Dynamically tunes resolution scale and JPEG quality to closely hit targetBytes / target reduction.
 * 
 * @param {File|Blob} pdfFile - input PDF file
 * @param {Object} options - { level, reductionPercent, targetBytes, customQuality, customDpi, onProgress }
 * @returns {Promise<{ blob: Blob, originalSize: number, compressedSize: number, savingsPercent: number, pageCount: number }>}
 */
export async function compressPdf(pdfFile, options = {}) {
  const {
    level = 'recommended', // 'recommended' | 'extreme' | 'low' | 'custom'
    reductionPercent = 65,
    customQuality = 0.65,
    customDpi = 150,
    onProgress,
  } = options;

  const originalSize = pdfFile.size;

  // Determine target bytes for the whole PDF
  let targetTotalBytes = options.targetBytes;
  if (!targetTotalBytes || typeof targetTotalBytes !== 'number' || targetTotalBytes <= 0) {
    let effectiveReduction = reductionPercent;
    if (level === 'extreme') effectiveReduction = 85;
    else if (level === 'low') effectiveReduction = 35;
    else if (level === 'recommended') effectiveReduction = 65;
    
    targetTotalBytes = Math.max(10240, Math.round(originalSize * (1 - effectiveReduction / 100)));
  }

  const notifyProgress = (percent, current, total, stage = '') => {
    if (typeof onProgress === 'function') {
      try {
        onProgress(percent, current, total, stage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  notifyProgress(5, 0, 0, 'Reading PDF structure...');

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;

  const newPdf = await PDFDocument.create();

  // PDF structural overhead (header, catalog, pages, xref, trailer)
  const overheadBytes = Math.round(1200 + 400 * numPages);
  let remainingBudget = Math.max(2048 * numPages, targetTotalBytes - overheadBytes);

  for (let i = 1; i <= numPages; i++) {
    const pagesLeft = numPages - i + 1;
    const targetPageBytes = Math.max(2048, Math.floor(remainingBudget / pagesLeft));

    notifyProgress(
      Math.round(((i - 0.7) / numPages) * 90),
      i,
      numPages,
      `Analyzing & rendering page ${i} of ${numPages}...`
    );

    const page = await pdfDoc.getPage(i);

    // Adaptive scale selection based on target page byte budget
    let chosenScale = 1.6;
    if (targetPageBytes >= 180000) {
      chosenScale = 2.0;
    } else if (targetPageBytes >= 110000) {
      chosenScale = 1.75;
    } else if (targetPageBytes >= 60000) {
      chosenScale = 1.45;
    } else if (targetPageBytes >= 30000) {
      chosenScale = 1.20;
    } else {
      chosenScale = 1.0;
    }

    let viewport = page.getViewport({ scale: chosenScale });
    let originalWidthPt = viewport.width / chosenScale;
    let originalHeightPt = viewport.height / chosenScale;

    let canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    let ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    notifyProgress(
      Math.round(((i - 0.3) / numPages) * 90),
      i,
      numPages,
      `Optimizing page ${i} to target size...`
    );

    // Binary search quality (0.28 to 0.95) to reach targetPageBytes as closely as possible
    let lowQ = 0.28;
    let highQ = 0.95;
    let bestBlob = null;
    let bestDiff = Infinity;

    for (let step = 0; step < 5; step++) {
      const testQ = (lowQ + highQ) / 2;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', testQ));
      if (!blob) break;

      const diff = Math.abs(blob.size - targetPageBytes);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestBlob = blob;
      }

      // If within 4% of target, good enough
      if (diff < targetPageBytes * 0.04) {
        bestBlob = blob;
        break;
      }

      if (blob.size > targetPageBytes) {
        highQ = testQ;
      } else {
        lowQ = testQ;
      }
    }

    // If even at high quality the page is significantly smaller than the budget (e.g. lots of whitespace)
    // and scale was modest, re-render at a higher scale to maximize resolution and fill user's target!
    if (bestBlob && bestBlob.size < targetPageBytes * 0.60 && chosenScale < 2.2) {
      const higherScale = Math.min(2.3, chosenScale * 1.35);
      viewport = page.getViewport({ scale: higherScale });
      originalWidthPt = viewport.width / higherScale;
      originalHeightPt = viewport.height / higherScale;

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      lowQ = 0.45;
      highQ = 0.95;
      for (let step = 0; step < 4; step++) {
        const testQ = (lowQ + highQ) / 2;
        const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', testQ));
        if (!blob) break;
        const diff = Math.abs(blob.size - targetPageBytes);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestBlob = blob;
        }
        if (blob.size > targetPageBytes) {
          highQ = testQ;
        } else {
          lowQ = testQ;
        }
      }
    }

    if (!bestBlob) {
      bestBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.70));
    }

    // Embed into new PDF
    const jpgBytes = await bestBlob.arrayBuffer();
    const embeddedImage = await newPdf.embedJpg(jpgBytes);
    const newPage = newPdf.addPage([originalWidthPt, originalHeightPt]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalWidthPt,
      height: originalHeightPt,
    });

    remainingBudget = Math.max(0, remainingBudget - bestBlob.size);

    notifyProgress(
      Math.round((i / numPages) * 90),
      i,
      numPages,
      `Optimized page ${i} of ${numPages}`
    );
  }

  notifyProgress(95, numPages, numPages, 'Repacking PDF streams and finalizing...');

  const compressedBytes = await newPdf.save({ useObjectStreams: true });
  const originalSizeVal = pdfFile.size;
  let compressedSize = compressedBytes.byteLength;
  let finalBlob = new Blob([compressedBytes], { type: 'application/pdf' });

  // If recompression made it larger, fallback to lossless stream repacking
  if (compressedSize >= originalSizeVal) {
    try {
      const origPdf = await PDFDocument.load(arrayBuffer);
      const losslessBytes = await origPdf.save({ useObjectStreams: true });
      if (losslessBytes.byteLength < originalSizeVal) {
        finalBlob = new Blob([losslessBytes], { type: 'application/pdf' });
        compressedSize = losslessBytes.byteLength;
      }
    } catch (e) {
      // keep finalBlob
    }
  }

  notifyProgress(100, numPages, numPages, 'Compression complete!');

  const savingsPercent = Math.max(0, Math.round(((originalSizeVal - compressedSize) / originalSizeVal) * 100));

  return {
    blob: finalBlob,
    originalSize: originalSizeVal,
    compressedSize,
    savingsPercent,
    pageCount: numPages,
  };
}

