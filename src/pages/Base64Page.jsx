import React, { useState } from 'react';
import UploadZone from '../components/UploadZone';
import FaqSection from '../components/FaqSection';
import { readFile, fmtBytes, downloadBlob } from '../utils/imageUtils';
import { useToast } from '../context/ToastContext';
import { Code2, Copy, Download, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Base64Page() {
  const { showToast } = useToast();

  // Image to Base64 State
  const [b64File, setB64File] = useState(null);
  const [b64Output, setB64Output] = useState('');
  const [copied, setCopied] = useState(false);

  // Base64 to Image State
  const [rawInput, setRawInput] = useState('');
  const [decodedSrc, setDecodedSrc] = useState(null);

  const handleImageUploaded = async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      setB64File(file);
      const src = await readFile(file);
      setB64Output(src);
      showToast('Base64 string generated!', 'success');
    } catch (err) {
      showToast('Error reading image file.', 'error');
    }
  };

  const copyToClipboard = () => {
    if (!b64Output) return;
    navigator.clipboard.writeText(b64Output).then(() => {
      setCopied(true);
      showToast('Base64 copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDecodeInput = (text) => {
    setRawInput(text);
    const trimmed = text.trim();
    if (!trimmed) {
      setDecodedSrc(null);
      return;
    }

    const src = trimmed.startsWith('data:') ? trimmed : `data:image/png;base64,${trimmed}`;
    setDecodedSrc(src);
  };

  const handleDownloadDecoded = async () => {
    if (!decodedSrc) return;
    try {
      const response = await fetch(decodedSrc);
      const blob = await response.blob();
      downloadBlob(blob, 'decoded_image.png');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
      showToast('Decoded image downloaded!', 'success');
    } catch (err) {
      showToast('Invalid Base64 data.', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] shadow-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#ff4f00]" /> Developer Tools &amp; Data URIs
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#201515] dark:text-[#fffefb] mb-3">
          Base64 <span className="text-[#ff4f00]">Encoder &amp; Decoder</span>
        </h1>
        <p className="text-sm sm:text-base text-[#605d52] dark:text-[#9f9b8f]">
          Convert images directly to Data URIs for fast inline web embedding, or decode raw Base64 strings back into downloadable images.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Card 1: Image to Base64 */}
        <div className="p-6 sm:p-8 rounded-lg sm:rounded-xl border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-4 text-[#201515] dark:text-[#fffefb]">
              <Code2 className="w-5 h-5 text-[#ff4f00]" /> Image → Base64
            </h3>

            {!b64File ? (
              <UploadZone
                onFilesSelected={handleImageUploaded}
                title="Drop image to encode"
                subtitle="Outputs clean Data URI string"
                hint="Click to browse"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-md border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-[#f8f4f0] dark:bg-[#0a0a0a]">
                  <img
                    src={b64Output}
                    alt="Preview"
                    className="w-16 h-16 rounded-md object-contain border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212]"
                  />
                  <div className="text-xs truncate">
                    <span className="font-bold text-[#201515] dark:text-[#fffefb] block truncate">
                      {b64File.name}
                    </span>
                    <span className="text-[#605d52] dark:text-[#9f9b8f]">
                      {fmtBytes(b64File.size)} · {b64Output.length.toLocaleString()} characters
                    </span>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={b64Output}
                  rows={6}
                  className="w-full p-3.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-xs font-mono text-[#201515] dark:text-[#fffefb] outline-none resize-none focus:ring-2 focus:ring-[#ff4f00]"
                />
              </div>
            )}
          </div>

          {b64Output && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] text-[#fffefb] text-xs font-bold shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Base64'}
              </button>
              <button
                onClick={() => {
                  setB64File(null);
                  setB64Output('');
                }}
                className="px-4 py-2.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.2)] bg-[#fffefb] dark:bg-[#1a1a1a] text-xs font-bold text-[#201515] dark:text-[#fffefb] hover:bg-[rgba(32,21,21,0.04)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Base64 to Image */}
        <div className="p-6 sm:p-8 rounded-lg sm:rounded-xl border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-4 text-[#201515] dark:text-[#fffefb]">
              <ImageIcon className="w-5 h-5 text-[#ff4f00]" /> Base64 → Image
            </h3>

            <p className="text-xs text-[#605d52] dark:text-[#9f9b8f] mb-3 font-semibold">
              Paste a raw Base64 string or a data:image/... URI below:
            </p>

            <textarea
              value={rawInput}
              onChange={(e) => handleDecodeInput(e.target.value)}
              placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
              rows={6}
              className="w-full p-3.5 rounded-md border border-[rgba(32,21,21,0.16)] dark:border-[rgba(255,255,255,0.18)] bg-[#fffefb] dark:bg-[#1a1a1a] text-xs font-mono text-[#201515] dark:text-[#fffefb] outline-none resize-none focus:ring-2 focus:ring-[#ff4f00] mb-4"
            />

            {decodedSrc && (
              <div className="p-3 rounded-md border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-[#f8f4f0] dark:bg-[#0a0a0a] text-center">
                <span className="text-[11px] font-bold text-[#605d52] dark:text-[#9f9b8f] uppercase tracking-wider block mb-2">
                  Decoded Image Preview
                </span>
                <img
                  src={decodedSrc}
                  alt="Decoded"
                  className="max-h-36 mx-auto rounded-md object-contain border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212]"
                />
              </div>
            )}
          </div>

          {decodedSrc && (
            <div className="mt-4">
              <button
                onClick={handleDownloadDecoded}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-[#ff4f00] hover:bg-[#e04500] text-[#fffefb] text-xs font-bold shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
              >
                <Download className="w-4 h-4" /> Download Decoded Image
              </button>
            </div>
          )}
        </div>
      </div>

      <FaqSection />
    </div>
  );
}

