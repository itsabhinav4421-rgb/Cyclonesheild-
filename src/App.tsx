import React, { useState, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AboutModal } from './components/AboutModal';
import { MapDashboard } from './components/MapDashboard';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import {
  FANI_TRACK_POINTS,
  ODISHA_ASSETS,
  KEY_ROADS,
  ALTERNATE_SCENARIOS,
  DEFAULT_INSURANCE_POLICIES,
  DEFAULT_HARDENING_ITEMS,
} from './data/mockData';
import {
  computeSurgePolygons,
  updateAssetStatus,
  updateRoadStatus,
  computeDistrictRisks,
} from './utils/surgeModel';
import { Map, Sliders, FileText } from 'lucide-react';

export default function App() {
  // Default demo state: T-48h Cyclone Fani
  const [currentHour, setCurrentHour] = useState<number>(-48);
  const [windSpeedKt, setWindSpeedKt] = useState<number>(110);
  const [tideLevelM, setTideLevelM] = useState<number>(0.0);
  const [landfallPos, setLandfallPos] = useState<{ lat: number; lng: number }>({
    lat: 19.80,
    lng: 85.82,
  });
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [insurancePolicies, setInsurancePolicies] = useState(DEFAULT_INSURANCE_POLICIES);

  // Mobile layout tab switcher ('map' | 'controls' | 'copilot')
  const [mobileTab, setMobileTab] = useState<'map' | 'controls' | 'copilot'>('map');

  // Find active track point
  const currentPoint = useMemo(() => {
    return (
      FANI_TRACK_POINTS.find((p) => p.hour === currentHour) ||
      FANI_TRACK_POINTS[2] // default T-48h
    );
  }, [currentHour]);

  // Synchronize wind speed with timeline when timeline slider moves
  const handleHourChange = useCallback((hour: number) => {
    setCurrentHour(hour);
    const pt = FANI_TRACK_POINTS.find((p) => p.hour === hour);
    if (pt) {
      setWindSpeedKt(pt.windSpeedKt);
    }
  }, []);

  // Compute model parameters
  const modelParams = useMemo(() => {
    return {
      windSpeedKt,
      tideLevelM,
      landfallLat: landfallPos.lat,
      landfallLng: landfallPos.lng,
      currentLat: currentPoint.lat,
      currentLng: currentPoint.lng,
      hour: currentHour,
    };
  }, [windSpeedKt, tideLevelM, landfallPos, currentPoint, currentHour]);

  // Dynamically computed layers
  const activeSurgePolygons = useMemo(() => {
    return computeSurgePolygons(modelParams);
  }, [modelParams]);

  const activeAssets = useMemo(() => {
    return updateAssetStatus(ODISHA_ASSETS, modelParams);
  }, [modelParams]);

  const activeRoads = useMemo(() => {
    return updateRoadStatus(KEY_ROADS, modelParams);
  }, [modelParams]);

  const activeDistrictRisks = useMemo(() => {
    return computeDistrictRisks(modelParams);
  }, [modelParams]);

  // Reset to default demo state
  const handleResetDemo = useCallback(() => {
    setCurrentHour(-48);
    setWindSpeedKt(110);
    setTideLevelM(0.0);
    setLandfallPos({ lat: 19.80, lng: 85.82 });
  }, []);

  const handleLandfallPreset = useCallback((lat: number, lng: number) => {
    setLandfallPos({ lat, lng });
  }, []);

  const handleLandfallMarkerDrag = useCallback((lat: number, lng: number) => {
    setLandfallPos({ lat, lng });
  }, []);

  const availableHours = useMemo(() => {
    return FANI_TRACK_POINTS.map((p) => p.hour);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. Control Room Header */}
      <Navbar
        currentHour={currentHour}
        windSpeedKt={windSpeedKt}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onResetDemo={handleResetDemo}
      />

      {/* 2. Main Dashboard Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Simulation, What-if sliders, Uncertainty */}
        <div
          className={`h-full z-10 transition-all duration-300 ${
            mobileTab === 'controls'
              ? 'absolute inset-0 z-30 flex'
              : 'hidden lg:flex'
          }`}
        >
          <LeftPanel
            currentHour={currentHour}
            onHourChange={handleHourChange}
            availableHours={availableHours}
            windSpeedKt={windSpeedKt}
            onWindSpeedChange={setWindSpeedKt}
            tideLevelM={tideLevelM}
            onTideLevelChange={setTideLevelM}
            landfallPos={landfallPos}
            onLandfallPreset={handleLandfallPreset}
            alternateTracks={ALTERNATE_SCENARIOS}
            districtRisks={activeDistrictRisks}
          />
        </div>

        {/* Center: Leaflet Interactive Map */}
        <div className="flex-1 h-full relative z-0">
          <MapDashboard
            currentPoint={currentPoint}
            allPoints={FANI_TRACK_POINTS}
            assets={activeAssets}
            roads={activeRoads}
            surgePolygons={activeSurgePolygons}
            alternateTracks={ALTERNATE_SCENARIOS}
            landfallPos={landfallPos}
            onLandfallChange={handleLandfallMarkerDrag}
            windSpeedKt={windSpeedKt}
          />
        </div>

        {/* Right Panel: AI Briefing, Evacuation Copilot, Alerts, Triggers, Hardening, Metrics */}
        <div
          className={`h-full z-10 transition-all duration-300 ${
            mobileTab === 'copilot'
              ? 'absolute inset-0 z-30 flex'
              : 'hidden lg:flex'
          }`}
        >
          <RightPanel
            currentPoint={currentPoint}
            allPoints={FANI_TRACK_POINTS}
            assets={activeAssets}
            roads={activeRoads}
            surgePolygons={activeSurgePolygons}
            districtRisks={activeDistrictRisks}
            windSpeedKt={windSpeedKt}
            tideLevelM={tideLevelM}
            landfallPos={landfallPos}
            insurancePolicies={insurancePolicies}
            onUpdatePolicy={setInsurancePolicies}
            hardeningItems={DEFAULT_HARDENING_ITEMS}
          />
        </div>
      </div>

      {/* 3. Mobile Navigation Bottom Bar (below lg screens) */}
      <div className="lg:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 p-2 z-40 text-xs font-mono">
        <button
          onClick={() => setMobileTab('controls')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded ${
            mobileTab === 'controls' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-slate-400'
          }`}
        >
          <Sliders className="w-4 h-4" /> Scenarios
        </button>

        <button
          onClick={() => setMobileTab('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded ${
            mobileTab === 'map' ? 'bg-red-950 text-red-300 border border-red-700' : 'text-slate-400'
          }`}
        >
          <Map className="w-4 h-4" /> Coast Map
        </button>

        <button
          onClick={() => setMobileTab('copilot')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded ${
            mobileTab === 'copilot' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'text-slate-400'
          }`}
        >
          <FileText className="w-4 h-4" /> AI Copilot
        </button>
      </div>

      {/* 4. Scientific Assumptions Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
