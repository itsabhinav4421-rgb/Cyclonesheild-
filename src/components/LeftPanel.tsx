import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Clock,
  Wind,
  Waves,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  Compass,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { TrackPoint, AlternateTrack, DistrictRisk } from '../types';

interface LeftPanelProps {
  currentHour: number;
  onHourChange: (hour: number) => void;
  availableHours: number[];
  windSpeedKt: number;
  onWindSpeedChange: (val: number) => void;
  tideLevelM: number;
  onTideLevelChange: (val: number) => void;
  landfallPos: { lat: number; lng: number };
  onLandfallPreset: (lat: number, lng: number) => void;
  alternateTracks: AlternateTrack[];
  districtRisks: DistrictRisk[];
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  currentHour,
  onHourChange,
  availableHours,
  windSpeedKt,
  onWindSpeedChange,
  tideLevelM,
  onTideLevelChange,
  landfallPos,
  onLandfallPreset,
  alternateTracks,
  districtRisks,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play timeline simulation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentIndex = availableHours.indexOf(currentHour);
      if (currentIndex < availableHours.length - 1) {
        onHourChange(availableHours[currentIndex + 1]);
      } else {
        setIsPlaying(false);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isPlaying, currentHour, availableHours, onHourChange]);

  const landfallPresets = [
    { label: 'Puri Center', lat: 19.80, lng: 85.82 },
    { label: 'Konark Coast', lat: 19.89, lng: 86.11 },
    { label: 'Paradip Port', lat: 20.29, lng: 86.67 },
    { label: 'Ganjam Coast', lat: 19.34, lng: 85.02 },
  ];

  return (
    <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200 overflow-y-auto shrink-0 select-none">
      {/* 1. Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Simulation & Scenarios
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
          BACKTEST MODE
        </span>
      </div>

      <div className="p-4 space-y-6">
        {/* 2. Timeline Scrubbing Control */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold flex items-center gap-1.5 text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> TIMELINE (T-72h to Landfall)
            </span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 transition"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Selected:</span>
            <span className="font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {currentHour < 0 ? `T${currentHour}h` : currentHour === 0 ? 'T-00h LANDFALL' : `T+${currentHour}h INLAND`}
            </span>
          </div>

          {/* Slider input */}
          <input
            type="range"
            min={0}
            max={availableHours.length - 1}
            step={1}
            value={availableHours.indexOf(currentHour)}
            onChange={(e) => onHourChange(availableHours[Number(e.target.value)])}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>T-72h</span>
            <span>T-48h</span>
            <span>T-24h</span>
            <span>T-00h</span>
            <span>T+6h</span>
          </div>
        </div>

        {/* 3. What-If Sliders */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shadow-sm space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Wind className="w-3.5 h-3.5 text-amber-400" /> What-If Parameter Controls
          </div>

          {/* Wind Speed Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                Sustained Wind Speed:
              </span>
              <span className="font-mono font-bold text-amber-400">
                {windSpeedKt} kt <span className="text-slate-400 font-normal">({Math.round(windSpeedKt * 1.852)} km/h)</span>
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={160}
              step={5}
              value={windSpeedKt}
              onChange={(e) => onWindSpeedChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>60 kt (Cat 1)</span>
              <span>110 kt (Cat 3)</span>
              <span>160 kt (Cat 5)</span>
            </div>
          </div>

          {/* Tide Level Slider */}
          <div className="space-y-1.5 pt-2 border-t border-slate-900">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <Waves className="w-3 h-3 text-cyan-400" /> Astronomical Tide:
              </span>
              <span className="font-mono font-bold text-cyan-300">
                {tideLevelM > 0 ? `+${tideLevelM.toFixed(1)}m` : `${tideLevelM.toFixed(1)}m`}
              </span>
            </div>
            <input
              type="range"
              min={-0.5}
              max={1.8}
              step={0.1}
              value={tideLevelM}
              onChange={(e) => onTideLevelChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            {/* Quick Tide Presets */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              <button
                onClick={() => onTideLevelChange(-0.5)}
                className={`py-1 text-[10px] font-mono rounded border ${
                  tideLevelM === -0.5 ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Low (-0.5m)
              </button>
              <button
                onClick={() => onTideLevelChange(0.0)}
                className={`py-1 text-[10px] font-mono rounded border ${
                  tideLevelM === 0.0 ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Mean (0.0m)
              </button>
              <button
                onClick={() => onTideLevelChange(1.8)}
                className={`py-1 text-[10px] font-mono rounded border ${
                  tideLevelM === 1.8 ? 'bg-rose-950 text-rose-300 border-rose-600' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Spring (+1.8m)
              </button>
            </div>
          </div>

          {/* Landfall Shift Presets */}
          <div className="space-y-1.5 pt-2 border-t border-slate-900">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" /> Landfall Target:
              </span>
              <span className="font-mono text-[11px] text-red-300">
                {landfallPos.lat.toFixed(2)}°N, {landfallPos.lng.toFixed(2)}°E
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {landfallPresets.map((preset) => {
                const isActive =
                  Math.abs(landfallPos.lat - preset.lat) < 0.05 &&
                  Math.abs(landfallPos.lng - preset.lng) < 0.05;
                return (
                  <button
                    key={preset.label}
                    onClick={() => onLandfallPreset(preset.lat, preset.lng)}
                    className={`py-1 px-2 text-[11px] rounded font-medium border text-left flex items-center justify-between transition ${
                      isActive
                        ? 'bg-red-950/80 text-red-200 border-red-600'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isActive && <Check className="w-3 h-3 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Alternate Track Scenarios */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shadow-sm space-y-2.5">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" /> Ensemble Scenarios
            </span>
            <span className="text-[10px] text-slate-400">4 Models</span>
          </div>

          <div className="space-y-1.5">
            {alternateTracks.map((scen) => (
              <div
                key={scen.id}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: scen.color }}
                    ></span>
                    <span>{scen.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono pl-4">
                    {scen.agency}
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-purple-300 border border-purple-900">
                    {scen.probability}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Probability of Inundation > 1m per District */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shadow-sm space-y-3">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" /> Inundation Prob &gt; 1.0m
            </span>
            <span className="text-[10px] text-slate-400">By District</span>
          </div>

          <div className="space-y-2.5">
            {districtRisks.map((d) => {
              let barColor = 'bg-emerald-500';
              if (d.probOver1m >= 70) barColor = 'bg-rose-600';
              else if (d.probOver1m >= 45) barColor = 'bg-orange-500';
              else if (d.probOver1m >= 25) barColor = 'bg-amber-500';

              return (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{d.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Surge: {d.projectedSurgeM}m
                      </span>
                      <span className="font-mono font-bold text-xs text-white">
                        {d.probOver1m}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${d.probOver1m}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Exposed pop: {(d.populationAtRisk / 1000).toFixed(0)}k</span>
                    <span className={`font-mono font-semibold ${d.cycloneWarning === 'RED' ? 'text-red-400' : d.cycloneWarning === 'ORANGE' ? 'text-orange-400' : 'text-amber-400'}`}>
                      {d.cycloneWarning} WARNING
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
