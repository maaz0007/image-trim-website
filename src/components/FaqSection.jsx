import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqSection({ customFaqs }) {
  const [openIndex, setOpenIndex] = useState(null);

  const defaultFaqs = [
    {
      q: 'Is ImageTrim completely free to use?',
      a: 'Yes, 100% free forever. There are no hidden fees, subscriptions, watermarks, or usage limits. All 8 tools are open and unrestricted for personal and commercial workflows.'
    },
    {
      q: 'Are my images uploaded to any server or cloud?',
      a: 'Never. All computations happen entirely client-side inside your browser using the HTML5 Canvas API and WebAssembly. Your photos and sensitive files never leave your device.'
    },
    {
      q: 'What image file formats are supported?',
      a: 'We support input in JPG, PNG, WEBP, GIF, BMP, TIFF, SVG, AVIF, and PDF. You can convert to JPG, PNG, WEBP, BMP, TIFF, AVIF, PDF, SVG, and Base64 format.'
    },
    {
      q: 'How many images can I bulk convert at once?',
      a: 'You can select up to 50 images in Bulk Convert mode. They will be processed in parallel directly in your browser and automatically bundled into a single ZIP file.'
    },
    {
      q: 'Does ImageTrim work offline and on mobile devices?',
      a: 'Yes. ImageTrim is responsive across phones, tablets, and desktops. Because processing runs in the browser without server dependency, it can even process offline once loaded.'
    }
  ];

  const faqs = customFaqs || defaultFaqs;

  return (
    <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="font-primary text-2xl sm:text-3xl font-semibold text-[#201515] dark:text-[#fffefb] mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-[#605d52] dark:text-[#a0a8c0]">
          Clear answers about privacy, performance, and supported formats.
        </p>
      </div>

      <div className="space-y-2.5">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          const faqId = `faq-ans-${index}`;
          return (
            <div
              key={index}
              className="rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={faqId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#201515] dark:text-[#fffefb] hover:text-[#ff4f00] dark:hover:text-[#ff4f00] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#ff4f00] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {isOpen && (
                <div
                  id={faqId}
                  className="px-5 pb-5 text-xs sm:text-sm text-[#605d52] dark:text-[#a0a8c0] font-normal leading-relaxed border-t border-[rgba(32,21,21,0.06)] dark:border-[rgba(255,255,255,0.08)] pt-3"
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
