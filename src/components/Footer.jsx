import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Zap, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)] mt-20 pt-16 pb-12 transition-colors duration-200 bg-[#fffdf9] dark:bg-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid Layout matching reference design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-12">

          {/* Column 1: Operational Status, Tagline & Social Icons */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">

            {/* Tagline & Brand */}
            <div>
              <Link to="/" className="inline-flex items-center gap-2 mb-1.5 focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                <div className="w-5 h-5 rounded bg-[#ff4f00] flex items-center justify-center text-white">
                  <Zap className="w-3 h-3 fill-white" />
                </div>
                <span className="text-base font-bold tracking-tight text-[#201515] dark:text-[#fffefb]">
                  ImageTrim<span className="text-[#ff4f00]">_</span>
                </span>
              </Link>
              <p className="text-sm text-[#605d52] dark:text-[#9f9b8f] leading-relaxed max-w-sm">
                Engineered for speed, accessibility, and client-side privacy. Zero server uploads.
              </p>
            </div>

            {/* Social Icons Row */}
            <div className="flex items-center gap-4 text-[#605d52] dark:text-[#9f9b8f] pt-1">
              {/* X / Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (formerly Twitter)"
                className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors p-1 -m-1"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors p-1 -m-1"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>

              {/* Reddit */}
              <a
                href="https://reddit.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Reddit"
                className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors p-1 -m-1"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.2 5.41 3.12 7.22l-.74 2.73a.75.75 0 00.93.92l2.87-.78A9.95 9.95 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.5 12c-.78 1.12-2.14 1.75-4.5 1.75s-3.72-.63-4.5-1.75a.5.5 0 11.82-.56C8.88 14.24 10.08 14.75 12 14.75s3.12-.51 3.68-1.31a.5.5 0 11.82.56zm-6.25-3.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm5.5 0a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Discord"
                className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors p-1 -m-1"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors p-1 -m-1"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.3a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5z" />
                </svg>
              </a>
            </div>

          </div>

          {/* Column 2: Solutions + Ecosystem (Stacked as in screenshot) */}
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-semibold text-[#201515] dark:text-[#fffefb] mb-3.5">
                Solutions
              </h4>
              <ul className="space-y-2.5 text-sm text-[#605d52] dark:text-[#9f9b8f]">
                <li>
                  <Link to="/dpi" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded flex items-center gap-1.5">
                    <span>DPI &amp; Quality</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#e3f2fd] text-[#1976d2] dark:bg-[#1565c0]/30 dark:text-[#90caf9]">New</span>
                  </Link>
                </li>
                <li>
                  <Link to="/remove-bg" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded flex items-center gap-1.5">
                    <span>Remove Background</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#e3f2fd] text-[#1976d2] dark:bg-[#1565c0]/30 dark:text-[#90caf9]">New</span>
                  </Link>
                </li>
                <li>
                  <Link to="/convert" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                    Convert
                  </Link>
                </li>
                <li>
                  <Link to="/compress" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                    Compress
                  </Link>
                </li>
                <li>
                  <Link to="/resize" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                    Resize & Crop
                  </Link>
                </li>
                <li>
                  <Link to="/pdf" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                    PDF Tools
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#201515] dark:text-[#fffefb] mb-3.5">
                Ecosystem
              </h4>
              <ul className="space-y-2.5 text-sm text-[#605d52] dark:text-[#9f9b8f]">
                <li>
                  <Link to="/bulk" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                    Bulk Engine
                  </Link>
                </li>
                <li>
                  <span className="text-[#605d52] dark:text-[#9f9b8f] cursor-default">
                    Client-Side Ecosystem
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Developers */}
          <div>
            <h4 className="text-sm font-semibold text-[#201515] dark:text-[#fffefb] mb-3.5">
              Developers
            </h4>
            <ul className="space-y-2.5 text-sm text-[#605d52] dark:text-[#9f9b8f]">
              <li>
                <Link to="/base64" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                  Base64 Studio
                </Link>
              </li>
              <li>
                <Link to="/watermark" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                  Watermark Studio
                </Link>
              </li>
              <li>
                <Link to="/rotate" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                  Rotate & Flip
                </Link>
              </li>
              <li>
                <span className="text-[#605d52] dark:text-[#9f9b8f] cursor-default">
                  In-Browser Canvas API
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div>
            <h4 className="text-sm font-semibold text-[#201515] dark:text-[#fffefb] mb-3.5">
              Resources
            </h4>
            <ul className="space-y-2.5 text-sm text-[#605d52] dark:text-[#9f9b8f]">
              <li>
                <Link to="/" className="hover:text-[#201515] dark:hover:text-[#fffefb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded">
                  Home
                </Link>
              </li>
              <li>
                <span className="text-[#605d52] dark:text-[#9f9b8f] cursor-default">
                  Privacy Architecture
                </span>
              </li>
              <li>
                <span className="text-[#605d52] dark:text-[#9f9b8f] cursor-default">
                  Zero Server Uploads
                </span>
              </li>
              <li>
                <span className="text-[#605d52] dark:text-[#9f9b8f] cursor-default">
                  Local Hardware Security
                </span>
              </li>
              <li>
                <span className="text-[#605d52] dark:text-[#9f9b8f] cursor-default">
                  Brand Guidelines
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Privacy Confirmation */}
        <div className="mt-14 pt-8 border-t border-[rgba(32,21,21,0.08)] dark:border-[rgba(255,255,255,0.1)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#605d52] dark:text-[#7f7c72]">
          <p>© {new Date().getFullYear()} ImageTrim. Engineered for speed, accessibility, and complete data privacy.</p>
          <p>All image encoding and transformations execute locally on client hardware.</p>
        </div>
      </div>
    </footer>
  );
}
