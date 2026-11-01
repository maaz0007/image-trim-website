# ImageTrim — Free Online Image Tool Suite (React + Vite + Tailwind CSS)

ImageTrim is a modern, 100% client-side image processing suite built with **React 18**, **Vite**, and **Tailwind CSS**. All image operations run directly in the user's browser using the HTML5 Canvas API and WebAssembly without uploading files to any external server.

---

## ⚡ Features & Tools

1. **Format Converter (`/convert`)**:
   - Convert between **JPG, PNG, WEBP, AVIF, PDF, SVG, BMP, TIFF**.
   - 12 quick format conversion presets (e.g. JPG → PNG, PNG → WebP, JPG → PDF, etc.).
   - Adjustable output quality slider with live side-by-side preview and estimated file size.

2. **Smart Compressor (`/compress`)**:
   - Compress to target sizes (e.g. **50 KB, 100 KB, 200 KB, 500 KB, 1 MB**) or custom target MB/KB.
   - Quality-based compression (5% – 100%).
   - Live file savings metric banner (e.g., *Saved 85%*).

3. **Resize & Interactive Cropper (`/resize`)**:
   - Pixel dimensions with **Lock Aspect Ratio** toggle.
   - Quick presets for social media (Instagram Square, Instagram Story, Facebook, Twitter, HD 720p, Full HD, 4K).
   - Interactive visual freehand crop tool with 1:1, 4:3, 16:9, 3:2, and Free aspect ratios.

4. **PDF Power Suite (`/pdf`)**:
   - **Images to PDF**: Multi-image compilation with page orientation, A4/A3/Letter page sizes.
   - **PDF to Images**: Extract high-resolution JPG or PNG pages with one-click ZIP download.
   - **Merge PDF**: Merge 2+ PDF files into a single document.
   - **Split PDF**: Split multi-page documents into individual page PDFs.

5. **Watermark Studio (`/watermark`)**:
   - Text watermark overlay with live font size slider, color picker, and opacity control.
   - 9-position alignment matrix (↖, ↑, ↗, ←, ●, →, ↙, ↓, ↘) or continuous tiled pattern.

6. **Rotate & Flip Studio (`/rotate`)**:
   - 90° clockwise, 180° invert, 90° counter-clockwise.
   - Horizontal and vertical mirror flipping.

7. **Base64 Encoder & Decoder (`/base64`)**:
   - Image to Data URI string with 1-click clipboard copy.
   - Base64 string to downloadable image decoder.

8. **Bulk Converter (`/bulk`)**:
   - Batch process up to 50 images simultaneously.
   - Format selection and progress bar.
   - Export all converted images as a `.zip` archive.

9. **Theme & UX**:
   - Dark mode (`#07080f` space aesthetic with neon cyan and purple accents) and Light mode.
   - Toast notification alerts for success, errors, and info.
   - Drag & drop upload zones with clipboard paste (`Ctrl+V`) support.
   - SEO backwards compatibility for `.html` URLs.

---

## 🚀 Getting Started

### Development Server
```bash
npm run dev
```
Runs the app in development mode at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Builds the app for production into the `dist/` folder with vendor chunk splitting.

### Preview Production Build
```bash
npm run preview
```
Runs a local static web server serving the `dist/` directory.

---

