import React from 'react';
import { ShieldAlert, Info, Clock, RotateCcw, AlertTriangle, Radio } from 'lucide-react';

interface NavbarProps {
  currentHour: number;
  windSpeedKt: number;
  onOpenAbout: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentHour,
  windSpeedKt,
  onOpenAbout,
  onResetDemo,
}) => {
  const getCatLabel = (kt: number) => {
    if (kt >= 137) return { text: 'SUPER CYCLONE', color: 'bg-rose-950 text-rose-300 border-rose-600' };
    if (kt >= 115) return { text: 'ESCS (CAT 4/5)', color: 'bg-red-950 text-red-300 border-red-600' };
    if (kt >= 90) return { text: 'VSCS (CAT 3)', color: 'bg-amber-950 text-amber-300 border-amber-600' };
    return { text: 'SCS (CAT 1/2)', color: 'bg-yellow-950 text-yellow-300 border-yellow-600' };
  };

  const cat = getCatLabel(windSpeedKt);

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand and Mission */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 shadow-lg shadow-red-950/40">
            <Radio className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
                CycloneShield <span className="text-red-500">AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
                ODISHA COAST
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Anticipatory Action & Coastal Surge Inundation Command Center
            </p>
          </div>
        </div>

        {/* Global Mandatory Decision Support Notice */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-amber-950/60 border border-amber-700/60 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium tracking-wide">
            Decision support. Human approval required before dispatch.
          </span>
        </div>

        {/* Live Status Indicators & Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-950/80 rounded border border-slate-800 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">STATE:</span>
            <span className="text-cyan-300 font-semibold">
              {currentHour < 0 ? `T${currentHour}h` : currentHour === 0 ? 'LANDFALL' : `T+${currentHour}h`}
            </span>
          </div>

          <div className={`hidden sm:flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold border ${cat.color}`}>
            {cat.text} ({windSpeedKt} kt)
          </div>

          <button
            onClick={onResetDemo}
            title="Reset to default demo backtest (T-48h Cyclone Fani)"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Demo T-48h</span>
          </button>

          <button
            onClick={onOpenAbout}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 transition"
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Model</span>
          </button>
        </div>
      </div>
    </header>
  );
};
