import React from 'react';
import FeaturesSection from '../components/FeaturesSection';
import WorkYourWaySection from '../components/WorkYourWaySection';
import FaqSection from '../components/FaqSection';
import { ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="text-center pt-16 pb-4 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

        <h1 className="font-primary text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] mb-5 text-[#201515] dark:text-[#fffefb]">
          Trim, Convert &
          <span className="ml-2 text-[#ff4f00]">Automate</span> Any Image.
        </h1>

        <p className="text-sm sm:text-base text-[#605d52] dark:text-[#a0a8c0] max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          JPG, PNG, WEBP, PDF, BMP, TIFF, Base64 - 8 high-performance browser tools, 100% private and processed on-device.
        </p>
      </section>

      {/* Features Overview with Tabs Bar */}
      <FeaturesSection />

      {/* Work Your Way Showcase */}
      <WorkYourWaySection />

      {/* FAQ Section */}
      <FaqSection />
    </div>
  );
}
