import React from 'react';
import WorkYourWaySection from '../components/WorkYourWaySection';
import FaqSection from '../components/FaqSection';
import { FileText, Smartphone, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WorkYourWayPage() {
  const pillars = [
    {
      icon: <FileText className="w-5 h-5 text-[#ff4f00]" />,
      title: 'Document Mode',
      subtitle: 'Complete PDF Integration',
      description:
        'Seamlessly combine images into multi-page PDF documents or unpack existing PDFs into crisp raster graphics with page-by-page control.',
      cta: 'Explore PDF Tools',
      link: '/pdf',
    },
    {
      icon: <Smartphone className="w-5 h-5 text-[#ff4f00]" />,
      title: 'Mobile Browser Engine',
      subtitle: 'Zero Installs Required',
      description:
        'Touch-optimized image cropping, compression, and conversion running natively in your mobile browser with 100% hardware privacy.',
      cta: 'Start Mobile Edit',
      link: '/compress',
    },
    {
      icon: <Terminal className="w-5 h-5 text-[#ff4f00]" />,
      title: 'Developer & Batch Power',
      subtitle: 'Data URIs & ZIP Archives',
      description:
        'Batch convert up to 50 assets simultaneously or encode images to compact Base64 strings for direct inline code and CSS embedding.',
      cta: 'Open Bulk Engine',
      link: '/bulk',
    },
  ];

  return (
    <div className="py-10">
      {/* 3-Card Showcase Component */}
      <WorkYourWaySection />

      {/* Feature Deep Dive */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fffefb] dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] shadow-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#ff4f00]" /> Tailored Workflows
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#201515] dark:text-[#fffefb]">
            Engineered For Every Workflow
          </h3>
          <p className="mt-2 text-sm text-[#605d52] dark:text-[#9f9b8f]">
            Choose the interface and performance configuration that fits your exact creative and technical demands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-[rgba(32,21,21,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)] flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h4 className="text-base font-bold text-[#201515] dark:text-[#fffefb] mb-1">
                  {p.title}
                </h4>
                <div className="text-xs font-semibold text-[#ff4f00] mb-2.5">
                  {p.subtitle}
                </div>
                <p className="text-xs sm:text-sm text-[#605d52] dark:text-[#9f9b8f] leading-relaxed mb-6">
                  {p.description}
                </p>
              </div>

              <Link
                to={p.link}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-[#201515] text-[#fffefb] hover:bg-[#36342e] dark:bg-[#fffefb] dark:text-[#201515] dark:hover:bg-slate-200 text-xs font-bold transition-colors"
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <FaqSection />
    </div>
  );
}

