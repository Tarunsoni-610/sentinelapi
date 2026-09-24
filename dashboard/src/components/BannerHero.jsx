import React, { useState } from 'react';
import { Shield, X, ArrowRight } from 'lucide-react';

export function BannerHero({ onTriggerScan }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative min-h-[88px] border border-[#e8e6fb] bg-gradient-to-r from-[#f6f5ff] via-[#fbfbff] to-[#f8f7ff] rounded-[9px] p-4 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 mb-7">
      {/* Icon */}
      <div className="w-10 h-10 rounded-[10px] bg-[#eeecff] text-[#7568ea] flex items-center justify-center flex-shrink-0">
        <Shield className="h-6 w-6" />
      </div>

      {/* Copy */}
      <div className="flex-1 pr-6 sm:pr-0">
        <h3 className="font-display font-bold text-[13px] text-[#39365d] mb-0.5">
          Your APIs deserve a second set of eyes.
        </h3>
        <p className="text-[11px] text-[#83869c] leading-relaxed">
          Run a security scan against your OpenAPI spec or try our intentionally vulnerable sandbox.
        </p>
      </div>

      {/* Button */}
      <button
        onClick={onTriggerScan}
        className="h-8 px-3 rounded-[5px] bg-white border border-[#dad7fb] text-[#6258d4] font-semibold text-[10px] hover:bg-[#faf9ff] transition-all flex items-center gap-1.5 shadow-2xs flex-shrink-0"
      >
        <span>Try demo scan</span>
        <ArrowRight className="h-3 w-3" />
      </button>

      {/* Close button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2.5 top-2.5 text-[#b1b2c1] hover:text-[#737b88] p-1 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
