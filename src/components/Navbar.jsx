import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Sun, Moon, Menu, X, RefreshCw, Archive, Maximize2, 
  FileText, Shield, RotateCw, Code2, Layers, Home, Zap, Scissors, Printer
} from 'lucide-react';

export default function Navbar() {
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'DPI', path: '/dpi', icon: Printer, badge: 'New' },
    { name: 'Remove BG', path: '/remove-bg', icon: Scissors },
    { name: 'Convert', path: '/convert', icon: RefreshCw },
    { name: 'Compress', path: '/compress', icon: Archive },
    { name: 'Resize', path: '/resize', icon: Maximize2 },
    { name: 'PDF', path: '/pdf', icon: FileText },
    { name: 'Watermark', path: '/watermark', icon: Shield },
    { name: 'Rotate', path: '/rotate', icon: RotateCw },
    { name: 'Base64', path: '/base64', icon: Code2 },
    { name: 'Bulk', path: '/bulk', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.12)] bg-[#fffdf9]/90 dark:bg-[#000000]/90 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-[#ff4f00] rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-[#ff4f00] flex items-center justify-center text-white font-extrabold shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-primary text-xl font-extrabold tracking-tight text-[#201515] dark:text-[#fffefb]">
            ImageTrim<span className="text-[#ff4f00]">_</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-normal transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#ff4f00] ${
                  isActive
                    ? 'bg-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515]'
                    : 'text-[#36342e] hover:text-[#201515] hover:bg-[rgba(32,21,21,0.06)] dark:text-[#a0a8c0] dark:hover:text-[#fffefb] dark:hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.name}</span>
                {link.badge && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#ff4f00] text-white'
                      : 'bg-[#e3f2fd] text-[#1976d2] dark:bg-[#1565c0]/40 dark:text-[#90caf9]'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark/Light Mode"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.2)] bg-transparent hover:bg-[rgba(32,21,21,0.05)] dark:hover:bg-[rgba(255,255,255,0.1)] text-[#201515] dark:text-[#fffefb] focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#201515]" />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-[rgba(32,21,21,0.15)] dark:border-[rgba(255,255,255,0.2)] text-[#201515] dark:text-[#fffefb] focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 border-t border-[rgba(32,21,21,0.1)] dark:border-[rgba(255,255,255,0.12)] bg-[#fffdf9] dark:bg-[#000000] shadow-md">
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold ${
                location.pathname === '/'
                  ? 'bg-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515]'
                  : 'text-[#36342e] bg-[rgba(32,21,21,0.04)] dark:bg-[rgba(255,255,255,0.06)] dark:text-[#fffefb]'
              }`}
            >
              <Home className="w-4 h-4 text-[#ff4f00]" />
              <span>All In One</span>
            </Link>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'bg-[#201515] text-[#fffefb] dark:bg-[#fffefb] dark:text-[#201515]'
                      : 'text-[#36342e] bg-[rgba(32,21,21,0.04)] dark:bg-[rgba(255,255,255,0.06)] dark:text-[#fffefb]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#ff4f00]" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
