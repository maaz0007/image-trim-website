import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import ConvertPage from './pages/ConvertPage';
import CompressPage from './pages/CompressPage';
import ResizePage from './pages/ResizePage';
import PdfPage from './pages/PdfPage';
import WatermarkPage from './pages/WatermarkPage';
import RotatePage from './pages/RotatePage';
import Base64Page from './pages/Base64Page';
import BulkPage from './pages/BulkPage';
import WorkYourWayPage from './pages/WorkYourWayPage';
import RemoveBg from './pages/RemoveBg';
import DpiPage from './pages/DpiPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#ff4f00] selection:text-[#fffefb]">
      <ScrollToTop />
      <Navbar />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/convert" element={<ConvertPage />} />
          <Route path="/compress" element={<CompressPage />} />
          <Route path="/resize" element={<ResizePage />} />
          <Route path="/pdf" element={<PdfPage />} />
          <Route path="/watermark" element={<WatermarkPage />} />
          <Route path="/rotate" element={<RotatePage />} />
          <Route path="/base64" element={<Base64Page />} />
          <Route path="/bulk" element={<BulkPage />} />
          <Route path="/dpi" element={<DpiPage />} />
          <Route path="/dpi-converter" element={<Navigate to="/dpi" replace />} />
          <Route path="/check-dpi" element={<Navigate to="/dpi" replace />} />
          <Route path="/remove-bg" element={<RemoveBg />} />
          <Route path="/removebg" element={<Navigate to="/remove-bg" replace />} />
          <Route path="/remove-background" element={<Navigate to="/remove-bg" replace />} />
          <Route path="/work-your-way" element={<WorkYourWayPage />} />

          {/* Legacy .html redirects for SEO & Bookmarks */}
          <Route path="/dpi.html" element={<Navigate to="/dpi" replace />} />
          <Route path="/remove-bg.html" element={<Navigate to="/remove-bg" replace />} />
          <Route path="/convert.html" element={<Navigate to="/convert" replace />} />
          <Route path="/compress.html" element={<Navigate to="/compress" replace />} />
          <Route path="/resize.html" element={<Navigate to="/resize" replace />} />
          <Route path="/pdf.html" element={<Navigate to="/pdf" replace />} />
          <Route path="/watermark.html" element={<Navigate to="/watermark" replace />} />
          <Route path="/rotate.html" element={<Navigate to="/rotate" replace />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

