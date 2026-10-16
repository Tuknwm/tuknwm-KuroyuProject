import React from 'react';
import { ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';

const BRAND_SLOTS = [1,2,3,4,5,6];

export default function OfficialStores() {
  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
      <div className="rounded-[8px] p-5 md:p-6" style={{ background: '#0C1C1C', border: '1px solid rgba(252,255,252,0.07)' }}>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(252,255,252,0.06)' }}>
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <ShieldCheck className="w-6 h-6" style={{ color: '#10b981' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg sm:text-xl font-bold" style={{ color: '#FCFFFC' }}>
                  Official Stores & Flagship Brands
                </h2>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-[1px] w-8" style={{ background: 'linear-gradient(90deg, #C8A96E, transparent)' }}></div>
                <p className="text-xs" style={{ color: 'rgba(252,255,252,0.35)' }}>100% Original · 7-Day Returns · Manufacturer Warranty</p>
              </div>
            </div>
          </div>

          <button className="text-xs sm:text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-70 self-start sm:self-auto" style={{ color: '#9694fc' }}>
            View All Brands <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {BRAND_SLOTS.map((slot) => (
            <div key={slot}
              className="rounded-[8px] p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.02] group"
              style={{ background: '#040F0F', border: '1px solid rgba(252,255,252,0.06)' }}>

              <div className="relative w-16 h-16 rounded-[8px] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform overflow-hidden"
                style={{ background: '#0C1C1C', border: '1px solid rgba(252,255,252,0.07)' }}>
                <div className="w-10 h-10 rounded-[8px] skeleton-box"></div>
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#10b981', boxShadow: '0 0 0 2px #040F0F' }}>
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </span>
              </div>

              <div className="h-3.5 w-20 skeleton-box rounded-[8px] mb-1.5"></div>
              <div className="h-2.5 w-14 skeleton-box rounded-[8px] opacity-40 mb-3"></div>

              <div className="w-full pt-2" style={{ borderTop: '1px solid rgba(252,255,252,0.05)' }}>
                <div className="h-6 w-full rounded-[8px] skeleton-box" style={{ background: 'rgba(150,148,252,0.1)' }}></div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
