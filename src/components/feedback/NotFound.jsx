import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import amogaLogo from '../../assets/images/amoga-logo.png';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';

const CURRENT_YEAR = 2026;

export function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0e0f12] text-[#F4F4F2] flex flex-col justify-between py-12">
      {/* Brand Header */}
      <header className="w-full">
        <Container className="flex items-center justify-between">
          <Link to="/" className="inline-block transition-opacity hover:opacity-90">
            <img
              src={amogaLogo}
              alt="Amoga"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>
          <span className="text-xs tracking-widest text-[#9FA1A8] uppercase font-mono">
            404 / Route Missing
          </span>
        </Container>
      </header>

      {/* Main 404 Content */}
      <main className="my-auto py-12">
        <Container size="narrow" className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#9FA1A8] mb-6">
            <Compass className="w-3.5 h-3.5 text-[#287A25]" />
            <span>Path: {location.pathname}</span>
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif text-[#F4F4F2] tracking-tight">
            404
          </h1>
          <h2 className="mt-4 text-xl sm:text-2xl font-light text-[#C6C8CD]">
            This page could not be found.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#9FA1A8] max-w-md mx-auto leading-relaxed">
            The link you followed may be incorrect, expired, or temporarily unavailable.
          </p>

          {/* Quick Collection Gateways */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
            <Link
              to="/food"
              className="p-4 rounded-lg bg-[#172B1C]/40 border border-[#3F7B43]/30 hover:border-[#3F7B43] transition-all group"
            >
              <div className="text-xs uppercase tracking-wider text-[#3F7B43] font-semibold">01</div>
              <div className="text-sm font-medium text-white group-hover:text-[#65815A]">Wholesome Pantry</div>
              <div className="text-xs text-[#9FA1A8] mt-0.5">Traditional Food Mixes</div>
            </Link>

            <Link
              to="/tea"
              className="p-4 rounded-lg bg-[#173B2A]/40 border border-[#65815A]/30 hover:border-[#65815A] transition-all group"
            >
              <div className="text-xs uppercase tracking-wider text-[#65815A] font-semibold">02</div>
              <div className="text-sm font-medium text-white group-hover:text-[#8CA483]">Wellness Tea</div>
              <div className="text-xs text-[#9FA1A8] mt-0.5">Herbal Teas & Infusions</div>
            </Link>

            <Link
              to="/sarees"
              className="p-4 rounded-lg bg-[#2C0E1A]/60 border border-[#C5A46D]/30 hover:border-[#C5A46D] transition-all group"
            >
              <div className="text-xs uppercase tracking-wider text-[#C5A46D] font-semibold">03</div>
              <div className="text-sm font-medium text-white group-hover:text-[#C5A46D]">Heritage Sarees</div>
              <div className="text-xs text-[#9FA1A8] mt-0.5">Traditional Sarees</div>
            </Link>

            <Link
              to="/jewellery"
              className="p-4 rounded-lg bg-[#18191D] border border-white/15 hover:border-white/40 transition-all group"
            >
              <div className="text-xs uppercase tracking-wider text-[#C6C8CD] font-semibold">04</div>
              <div className="text-sm font-medium text-white group-hover:text-[#C6C8CD]">Sterling Silver</div>
              <div className="text-xs text-[#9FA1A8] mt-0.5">Silver Jewellery</div>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="bg-[#1C1D20] text-[#F4F4F2] border-white/10 hover:border-white/20"
              >
                Return to Home
              </Button>
            </Link>
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-[#6B6D74]">
        Amoga E-Commerce &copy; {CURRENT_YEAR}
      </footer>
    </div>
  );
}
