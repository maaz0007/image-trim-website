import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, Archive, Maximize2, FileText,
  Shield, RotateCw, Code2, Layers, LayoutGrid, ArrowRight, Scissors, Printer
} from 'lucide-react';

export default function FeaturesSection({ onSelectTool }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'dpi', label: 'DPI & Quality', icon: Printer },
    { id: 'remove-bg', label: 'Remove BG', icon: Scissors },
    { id: 'convert', label: 'Convert', icon: RefreshCw },
    { id: 'compress', label: 'Compress', icon: Archive },
    { id: 'resize', label: 'Resize', icon: Maximize2 },
    { id: 'pdf', label: 'PDF', icon: FileText },
    { id: 'watermark', label: 'Watermark', icon: Shield },
    { id: 'rotate', label: 'Rotate', icon: RotateCw },
    { id: 'base64', label: 'Base64', icon: Code2 },
    { id: 'bulk', label: 'Bulk', icon: Layers },
  ];

  const tools = [
    {
      id: 'dpi',
      title: 'DPI & Quality',
      desc: 'Convert DPI (200, 300, 600), inspect print resolution, increase image quality & super-res upscale.',
      icon: Printer,
      badge: 'New!',
      iconBg: '#4f46e5',
      path: '/dpi'
    },
    {
      id: 'remove-bg',
      title: 'Remove background',
      desc: 'Quickly remove image backgrounds with high accuracy. Instantly detect objects and cut out backgrounds with ease.',
      icon: Scissors,
      badge: 'New!',
      iconBg: '#7cb342',
      path: '/remove-bg'
    },
    {
      id: 'convert',
      title: 'Image Convert',
      desc: 'Convert seamlessly between JPG, PNG, WEBP, BMP, TIFF, and AVIF.',
      icon: RefreshCw,
      path: '/convert'
    },
    {
      id: 'compress',
      title: 'Smart Compress',
      desc: 'Shrink file size up to 90% without visible quality loss for web & mobile.',
      icon: Archive,
      path: '/compress'
    },
    {
      id: 'resize',
      title: 'Resize & Crop',
      desc: 'Custom dimensions, social media aspect ratios, and visual freehand crop.',
      icon: Maximize2,
      path: '/resize'
    },
    {
      id: 'pdf',
      title: 'PDF Suite',
      desc: 'Convert images into PDF, extract PDF pages, merge & split documents.',
      icon: FileText,
      path: '/pdf'
    },
    {
      id: 'watermark',
      title: 'Watermark Studio',
      desc: 'Protect photos with custom branding, 9-point positioning & tiled overlays.',
      icon: Shield,
      path: '/watermark'
    },
    {
      id: 'rotate',
      title: 'Rotate & Flip',
      desc: '90°, 180°, 270° rotation and horizontal / vertical mirroring in 1-click.',
      icon: RotateCw,
      path: '/rotate'
    },
    {
      id: 'base64',
      title: 'Base64 Tool',
      desc: 'Encode images to Base64 strings or decode Data URIs back to download.',
      icon: Code2,
      path: '/base64'
    },
    {
      id: 'bulk',
      title: 'Bulk Convert',
      desc: 'Process up to 50 images in batch simultaneously and download as a ZIP file.',
      icon: Layers,
      path: '/bulk'
    },
  ];

  const filteredTools = activeTab === 'all'
    ? tools
    : tools.filter((tool) => tool.id === activeTab);

  const handleCardClick = (tool) => {
    navigate(tool.path);
    if (onSelectTool) {
      onSelectTool(tool.id);
    }
  };

  const handleCardKeyDown = (e, tool) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(tool);
    }
  };

  return (
    <section className="pb-12 pt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Tabs Bar */}
      <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <div className="p-1 rounded-full border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] shadow-sm flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none ${isActive
                  ? 'bg-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515] shadow-sm'
                  : 'text-[#605d52] dark:text-[#a0a8c0] hover:text-[#201515] dark:hover:text-[#fffefb] hover:bg-[rgba(32,21,21,0.05)] dark:hover:bg-[rgba(255,255,255,0.08)]'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(tool)}
              onKeyDown={(e) => handleCardKeyDown(e, tool)}
              className="group p-6 rounded-lg border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#121212] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#201515] dark:hover:border-[#fffefb] cursor-pointer flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#ff4f00] outline-none"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                      tool.iconBg
                        ? 'text-white shadow-xs'
                        : 'bg-[#f8f4f0] dark:bg-[#1f1f1f] border border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)] text-[#ff4f00]'
                    }`}
                    style={tool.iconBg ? { backgroundColor: tool.iconBg } : undefined}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {tool.badge && (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold tracking-tight bg-[#e3f2fd] text-[#1976d2] dark:bg-[#1565c0]/30 dark:text-[#90caf9] border border-[#90caf9]/40 shadow-xs">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-primary text-base font-bold text-[#201515] dark:text-[#fffefb] mb-1.5 group-hover:text-[#ff4f00] transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-[#605d52] dark:text-[#a0a8c0] leading-relaxed">
                  {tool.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs font-semibold text-[#ff4f00]">
                <span>Open tool</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
