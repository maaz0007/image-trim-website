import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function WorkYourWaySection() {
  const cards = [
    {
      id: 'document-mode',
      title: 'Switch to document mode',
      description:
        'Transform single or batch images into clean, multi-page PDF documents or extract crystal-clear images from existing PDFs.',
      link: '/pdf',
      badge: 'PDF & Documents',
      mockup: (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {/* Document Sheet Mockup */}
          <div className="w-48 bg-white dark:bg-[#1c2936] rounded-xl shadow-md border border-[rgba(32,21,21,0.08)] dark:border-white/10 p-3.5 flex gap-2.5 transform transition-transform duration-300 group-hover:scale-105">
            {/* Sidebar Page Thumbnails */}
            <div className="w-6 space-y-1.5 flex-shrink-0 pt-0.5">
              <div className="w-full h-4 rounded-xs bg-blue-100/70 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800" />
              <div className="w-full h-4 rounded-xs bg-slate-100 dark:bg-slate-800" />
              <div className="w-full h-4 rounded-xs bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Main Document Content */}
            <div className="flex-1">
              {/* Header Box */}
              <div className="border border-blue-400/60 dark:border-blue-500/60 bg-blue-50/70 dark:bg-blue-950/50 px-2 py-1 rounded text-[9px] font-bold text-blue-700 dark:text-blue-300 mb-2 w-fit tracking-wide">
                BUSINESS CONTRACT
              </div>

              {/* Document Text Lines */}
              <div className="space-y-1 mb-2.5">
                <div className="h-1.5 w-full bg-blue-200/80 dark:bg-blue-800/70 rounded-full" />
                <div className="h-1.5 w-3/4 bg-amber-100/90 dark:bg-amber-900/40 rounded-full" />
                <div className="h-1.5 w-5/6 bg-blue-200/80 dark:bg-blue-800/70 rounded-full" />
              </div>

              {/* Document Image Preview */}
              <div className="h-12 w-full rounded-md bg-gradient-to-tr from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 overflow-hidden relative border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                  Embedded Asset
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'mobile-scanner',
      title: 'Scan and edit on the go',
      description:
        'Process, compress, and rotate photos instantly on any smartphone or tablet browser with 100% offline, on-device performance.',
      link: '/compress',
      badge: 'Responsive & Mobile',
      mockup: (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {/* Smartphone Mockup */}
          <div className="w-36 h-48 bg-white dark:bg-[#1c2936] rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-2 flex flex-col justify-between relative overflow-hidden transform transition-transform duration-300 group-hover:scale-105">
            {/* Status Bar */}
            <div className="flex items-center justify-between text-[8px] font-semibold text-slate-400 px-1 pt-0.5">
              <span>9:41</span>
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="w-2.5 h-1.5 rounded-xs bg-slate-400 dark:bg-slate-500" />
              </div>
            </div>

            {/* Mobile Screen Content */}
            <div className="px-1 pt-1 flex-1">
              <div className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight mb-1.5">
                Interior <br />
                <span className="text-slate-400 font-normal">design|</span>
              </div>

              {/* Grid of Images */}
              <div className="grid grid-cols-2 gap-1 h-20">
                <div className="rounded bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800" />
                <div className="rounded bg-gradient-to-tr from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900 border border-amber-200 dark:border-amber-800" />
              </div>
            </div>

            {/* Green Laser Scanner Line Effect */}
            <div className="absolute left-0 right-0 top-[45%] pointer-events-none">
              <div className="h-[2px] w-full bg-emerald-500 shadow-[0_0_12px_#10b981]" />
              <div className="h-6 w-full -mt-3 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none" />
            </div>

            {/* Home Indicator */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-0.5" />
          </div>
        </div>
      ),
    },
    {
      id: 'scale-developer',
      title: 'Scale with Batch & Developer Tools',
      description:
        'Automate image conversions at scale with up to 50 assets in one batch, or encode raw files to instant Base64 Data URIs.',
      link: '/bulk',
      badge: 'Batch & Code',
      mockup: (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div className="relative w-52 h-44 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-105">
            {/* Back Layer: Landscape with crop/selection guide */}
            <div className="absolute top-2 left-2 w-36 h-28 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-900 border-2 border-blue-400 p-1 shadow-md overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-2 h-2 border-t-2 border-l-2 border-blue-400" />
                <div className="w-2 h-2 border-t-2 border-r-2 border-blue-400" />
              </div>
              <div className="text-[9px] font-mono text-center text-blue-200 font-semibold opacity-75">
                1920 × 1080
              </div>
              <div className="flex justify-between items-end">
                <div className="w-2 h-2 border-b-2 border-l-2 border-blue-400" />
                <div className="w-2 h-2 border-b-2 border-r-2 border-blue-400" />
              </div>
            </div>

            {/* Front Layer: Code Editor / Terminal Window */}
            <div className="absolute bottom-1 right-1 w-36 rounded-lg bg-[#181926] text-white p-2.5 shadow-xl border border-slate-700/60 font-mono text-[9px] leading-relaxed">
              {/* Window Controls */}
              <div className="flex gap-1 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              {/* Code Snippet */}
              <div className="text-slate-400">/* API */</div>
              <div>
                <span className="text-blue-300">$task</span> = <span className="text-emerald-300">$trim</span>-&gt;
              </div>
              <div className="text-slate-500">// Process batch</div>
              <div>
                <span className="text-blue-300">$file</span> = <span className="text-amber-300">save()</span>;
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#201515] dark:text-[#fffefb]">
          Work your way
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#605d52] dark:text-[#9f9b8f]">
          Tailor your image workflows across documents, mobile browsers, and batch developer utilities.
        </p>
      </div>

      {/* 3-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {cards.map((card) => (
          <Link
            key={card.id}
            to={card.link}
            className="group flex flex-col justify-between bg-white dark:bg-[#121212] rounded-2xl border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#ff4f00]/50 dark:hover:border-[#ff4f00]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
          >
            <div>
              {/* Visual Mockup Container (Soft tinted background) */}
              <div className="w-full h-52 sm:h-56 rounded-xl sm:rounded-2xl bg-[#f0f6fc] dark:bg-[#131b26] border border-blue-50/50 dark:border-blue-950/50 overflow-hidden mb-5 flex items-center justify-center">
                {card.mockup}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-[#201515] dark:text-[#fffefb] group-hover:text-[#ff4f00] transition-colors mb-2 tracking-tight">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#605d52] dark:text-[#9f9b8f] leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Bottom Row: Pill badge + Arrow Button */}
            <div className="flex items-center justify-between pt-6 mt-4 border-t border-[rgba(32,21,21,0.06)] dark:border-[rgba(255,255,255,0.08)]">
              <span className="text-[11px] font-semibold text-[#605d52] dark:text-[#9f9b8f] group-hover:text-[#201515] dark:group-hover:text-[#fffefb] transition-colors">
                {card.badge}
              </span>

              <div className="w-8 h-8 rounded-full border border-[rgba(32,21,21,0.14)] dark:border-[rgba(255,255,255,0.18)] flex items-center justify-center text-[#605d52] dark:text-[#9f9b8f] group-hover:bg-[#ff4f00] group-hover:border-[#ff4f00] group-hover:text-white transition-all shadow-xs">
                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

