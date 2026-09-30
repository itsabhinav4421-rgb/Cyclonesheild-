import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Navigation,
  BellRing,
  FileCheck2,
  Wrench,
  BarChart3,
  Volume2,
  VolumeX,
  Send,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  PhoneCall,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrackPoint,
  Asset,
  KeyRoad,
  SurgePolygon,
  InsurancePolicy,
  HardeningItem,
  AlertDispatchRecord,
  DistrictRisk
} from '../types';

interface RightPanelProps {
  currentPoint: TrackPoint;
  allPoints: TrackPoint[];
  assets: Asset[];
  roads: KeyRoad[];
  surgePolygons: SurgePolygon[];
  districtRisks: DistrictRisk[];
  windSpeedKt: number;
  tideLevelM: number;
  landfallPos: { lat: number; lng: number };
  insurancePolicies: InsurancePolicy[];
  onUpdatePolicy: (updated: InsurancePolicy[]) => void;
  hardeningItems: HardeningItem[];
}

export const RightPanel: React.FC<RightPanelProps> = ({
  currentPoint,
  allPoints,
  assets,
  roads,
  surgePolygons,
  districtRisks,
  windSpeedKt,
  tideLevelM,
  landfallPos,
  insurancePolicies,
  onUpdatePolicy,
  hardeningItems,
}) => {
  const [activeTab, setActiveTab] = useState<
    'briefing' | 'evacuation' | 'alerts' | 'insurance' | 'hardening' | 'impact'
  >('briefing');

  // 1. Briefing state
  const [briefing, setBriefing] = useState<{
    summary: string;
    confidence: number;
    confidenceLabel: string;
    evidenceBullets: string[];
  }>({
    summary:
      'At T-48h prior to landfall, Cyclone Fani equivalent is tracking toward the Puri-Konark coast as an Extremely Severe Cyclonic Storm (ESCS) packing sustained winds of 110 knots (204 km/h). Coupled with a mean astronomical tide, peak storm surge is computed at 2.4m in coastal lowlands of Puri, Jagatsinghpur, and Chilika mouth. Anticipatory evacuation of 420,000 residents in vulnerable kutcha housing must commence before T-24h.',
    confidence: 94,
    confidenceLabel: 'Very High Confidence',
    evidenceBullets: [
      'Sustained wind field: 110 kt with gust potential up to 135 kt within 45km of eye wall.',
      'Peak surge depth: 2.4m modelled along Puri beachfront, Satapada lagoon mouth, and Astaranga.',
      'Road alert: Marine Drive (Puri-Konark) projected to be inundated by >0.8m seawater.',
      'Shelter status: Satapada & Chandrabhaga coastal shelters flagged for low plinth surge exposure.',
    ],
  });
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  // 2. Evacuation state
  const [evacuationPlan, setEvacuationPlan] = useState<any>({
    actions: [
      {
        id: 'act-1',
        priority: 'CRITICAL',
        target: 'Puri Coastal Wards 1 to 8 & Pentakota Fishermen Colony',
        action: 'Mandatory evacuation of 42,000 residents within 2.5km of shoreline.',
        deadline: 'T-24h (Target: 18:00 IST)',
        route: 'Inland NH-316 via Malatipatpur (Marine Drive is BLOCKED by surge)',
        assignedShelters: 'Puri District Multipurpose Shelters #3, #4, and Pipili High School Shelter',
        reasoning: 'Projected storm surge > 2.2m will breach traditional sea dykes.',
      },
      {
        id: 'act-2',
        priority: 'HIGH',
        target: 'Chilika Satapada & Brahmagiri Lagoon Villages',
        action: 'Relocate low-lying island settlements using mechanized NDRF boats before wind speeds surpass 45 kt.',
        deadline: 'T-18h operational cutoff',
        route: 'State Highway 13 inland connector to Brahmagiri Higher Secondary MCS',
        assignedShelters: 'Brahmagiri MCS #1 and Rebananuagaon Shelter',
        reasoning: 'Lagoon water ingress combined with 1.8m surge will cut off road links.',
      },
      {
        id: 'act-3',
        priority: 'HIGH',
        target: 'Paradip Port & Ersama Lowlands (Jagatsinghpur)',
        action: 'De-berth non-essential vessels and shift 18,500 port workers & slum dwellers.',
        deadline: 'T-18h operational cutoff',
        route: 'SH-12 inland link towards Jagatsinghpur town',
        assignedShelters: 'Paradip Multi-Purpose Cyclone Shelter #2 & #4',
        reasoning: 'Gale winds (>100 kt) and tidal push threaten coastal mudflats.',
      },
    ],
    shelterAlerts: [
      {
        name: 'Satapada Multi-Purpose Shelter (Chilika)',
        issue: 'Inundation threat / Plinth breach (>1.4m water)',
        capacity: 900,
        rerouteTo: 'Brahmagiri MCS #1 (Safe Haven)',
        status: 'REJECTED_UNSAFE',
      },
      {
        name: 'Chandrabhaga Fishermen Shelter',
        issue: 'Direct shoreline wave action exposure',
        capacity: 800,
        rerouteTo: 'Konark Marine Relief Center',
        status: 'REJECTED_UNSAFE',
      },
    ],
    rerouteAdvise:
      'Road alert: Marine Drive is currently BLOCKED by seawater surge. Evacuation convoys MUST divert through inland NH-316.',
  });
  const [isGeneratingEvacuation, setIsGeneratingEvacuation] = useState(false);

  // 3. Alerts state
  const [selectedLanguage, setSelectedLanguage] = useState<
    'English' | 'Hindi' | 'Odia' | 'Bengali' | 'Tamil' | 'Telugu'
  >('Odia');
  const [currentAlert, setCurrentAlert] = useState<{
    title: string;
    level: string;
    leadTime: string;
    content: string;
    keyRules: string[];
  }>({
    title: 'ଲାଲ୍ ସତର୍କତା: ଭୟଙ୍କର ବାତ୍ୟା ଜରୁରୀକାଳୀନ ସୂଚନା',
    level: 'ଲାଲ୍ ସତର୍କତା (RED ALERT)',
    leadTime: 'ଆଗାମୀ ୨୪ ରୁ ୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ସ୍ଥଳଭାଗ ଛୁଇଁବ',
    content:
      'ଏକ ଅତ୍ୟନ୍ତ ଭୀଷଣ ବାତ୍ୟା ପୁରୀ ତଥା ଓଡ଼ିଶା ଉପକୂଳ ଆଡ଼କୁ ଅଗ୍ରସର ହେଉଛି। ପବନର ବେଗ ଘଣ୍ଟାପ୍ରତି ୧୭୫ କିମିରୁ ଅଧିକ ହେବ ଏବଂ ସମୁଦ୍ର ଜୁଆର ୩ ମିଟର ଉଚ୍ଚତା ପର୍ଯ୍ୟନ୍ତ ଗାଁରେ ପଶିପାରେ। କଚ୍ଚା ଘରେ ରହୁଥିବା ତଥା ସମୁଦ୍ର କୂଳର ସମସ୍ତ ଲୋକ ତୁରନ୍ତ ନିକଟସ୍ଥ ପକ୍କା ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀକୁ ଚାଲିଯାଆନ୍ତୁ। ସମୁଦ୍ର କୂଳକୁ ଯାଆନ୍ତୁ ନାହିଁ। ଜରୁରୀ ସହାୟତା ପାଇଁ ୧୦୭୦ କିମ୍ବା ୧୦୭୭ ନମ୍ବରକୁ ଡାଏଲ କରନ୍ତୁ।',
    keyRules: [
      'ସନ୍ଧ୍ୟା ୬ଟା ପୂର୍ବରୁ ପକ୍କା ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳକୁ ଚାଲିଯାଆନ୍ତୁ।',
      'ସମୁଦ୍ର କିମ୍ବା ବନ୍ୟା ପାଣି ପାଖକୁ ଯାଆନ୍ତୁ ନାହିଁ।',
      'ରୋଷେଇ ଗ୍ୟାସ୍ ଏବଂ ବିଦ୍ୟୁତ ମୁଖ୍ୟ ସୁଇଚ୍ ବନ୍ଦ କରନ୍ତୁ।',
      'ଜରୁରୀକାଳୀନ ହେଲ୍ପଲାଇନ: ୧୦୭୦ / ୧୦୭୭',
    ],
  });
  const [alertWorkflowStatus, setAlertWorkflowStatus] = useState<
    'DRAFT' | 'APPROVED' | 'DISPATCHED'
  >('DRAFT');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<AlertDispatchRecord[]>([
    {
      id: 'disp-101',
      timestamp: '01 May, 06:15 IST',
      language: 'Odia',
      targetArea: 'Puri, Ganjam, Jagatsinghpur',
      status: 'DISPATCHED',
      recipientsCount: 245000,
      channels: ['Cell Broadcast', 'VHF Siren', 'SMS Gateway'],
      approvedBy: 'Incident Commander S. Mohapatra (IAS)',
    },
  ]);
  const [isGeneratingAlert, setIsGeneratingAlert] = useState(false);

  // 4. Insurance Trigger Simulation state
  const [auditLogs, setAuditLogs] = useState<
    {
      id: string;
      timestamp: string;
      district: string;
      reason: string;
      payoutCr: number;
    }[]
  >([
    {
      id: 'audit-1',
      timestamp: 'T-48h System Initialization',
      district: 'Puri',
      reason: 'Parametric Policy Active - Telemetry monitoring armed',
      payoutCr: 0,
    },
  ]);

  // Compute live insurance trigger evaluation
  useEffect(() => {
    const updated = insurancePolicies.map((policy) => {
      const factors: string[] = [];
      let isTriggered = false;

      // Check simulated conditions
      const maxSurgeInDistrict =
        surgePolygons
          .filter((p) => p.district.toLowerCase() === policy.district.toLowerCase())
          .reduce((max, p) => Math.max(max, p.depthM), 0) || 0;

      if (windSpeedKt >= policy.windThresholdKt) {
        factors.push(`Wind ${windSpeedKt}kt >= ${policy.windThresholdKt}kt`);
        isTriggered = true;
      }
      if (maxSurgeInDistrict >= policy.surgeThresholdM) {
        factors.push(`Surge ${maxSurgeInDistrict.toFixed(1)}m >= ${policy.surgeThresholdM}m`);
        isTriggered = true;
      }

      const payout = isTriggered ? policy.maxPayoutCr : 0;

      return {
        ...policy,
        status: isTriggered ? ('TRIGGERED' as const) : ('ARMED' as const),
        estimatedPayoutCr: payout,
        triggeredFactors: factors,
      };
    });

    onUpdatePolicy(updated);
  }, [windSpeedKt, surgePolygons]);

  // AI Briefing Generator
  const generateAIBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const payload = {
        currentHour: currentPoint.hour,
        windSpeedKt,
        tideLevel: tideLevelM > 0 ? `+${tideLevelM}m (Spring)` : `${tideLevelM}m`,
        surgeMaxM: Math.max(...surgePolygons.map((p) => p.depthM), 0),
        landfallLocation: `${landfallPos.lat.toFixed(2)}°N, ${landfallPos.lng.toFixed(2)}°E`,
        highRiskDistricts: districtRisks.filter((d) => d.probOver1m > 50).map((d) => d.name),
        sheltersAtRisk: assets.filter((a) => a.type === 'shelter' && a.status === 'inundated'),
      };

      const res = await fetch('/api/gemini/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data && data.summary) {
        setBriefing(data);
      }
    } catch (e) {
      console.error('Failed to generate briefing:', e);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  // AI Evacuation Generator
  const generateAIEvacuation = async () => {
    setIsGeneratingEvacuation(true);
    try {
      const payload = {
        currentHour: currentPoint.hour,
        windSpeedKt,
        floodedRoads: roads.filter((r) => r.status === 'inundated').map((r) => r.name),
        floodedShelters: assets.filter((a) => a.type === 'shelter' && a.status === 'inundated'),
        safeShelters: assets.filter((a) => a.type === 'shelter' && a.status === 'operational'),
      };

      const res = await fetch('/api/gemini/evacuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data && data.actions) {
        setEvacuationPlan(data);
      }
    } catch (e) {
      console.error('Failed to generate evacuation plan:', e);
    } finally {
      setIsGeneratingEvacuation(false);
    }
  };

  // AI Alert Generator by Language
  const generateAIAlert = async (lang: string) => {
    setIsGeneratingAlert(true);
    try {
      const payload = {
        language: lang,
        timelineHour: currentPoint.hour,
        windSpeedKt,
        surgeHeight: Math.max(...surgePolygons.map((p) => p.depthM), 0),
        targetDistrict: 'Puri & Coastal Odisha',
      };

      const res = await fetch('/api/gemini/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data && data.content) {
        setCurrentAlert(data);
        setAlertWorkflowStatus('DRAFT');
      }
    } catch (e) {
      console.error('Failed to generate alert:', e);
    } finally {
      setIsGeneratingAlert(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang as any);
    generateAIAlert(lang);
  };

  // Web Speech API for TTS ("Listen" button)
  const handleListenAlert = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `${currentAlert.title}. ${currentAlert.content}. ${currentAlert.keyRules.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Set language tag
    const langMap: Record<string, string> = {
      English: 'en-IN',
      Hindi: 'hi-IN',
      Odia: 'or-IN',
      Bengali: 'bn-IN',
      Tamil: 'ta-IN',
      Telugu: 'te-IN',
    };
    utterance.lang = langMap[selectedLanguage] || 'en-IN';
    utterance.rate = 0.9; // clear, deliberate pace for emergency

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  // Approval & Dispatch Actions
  const handleApproveAlert = () => {
    setAlertWorkflowStatus('APPROVED');
  };

  const handleDispatchAlert = () => {
    setAlertWorkflowStatus('DISPATCHED');
    const newRecord: AlertDispatchRecord = {
      id: `disp-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      language: selectedLanguage,
      targetArea: 'Puri, Ganjam, Jagatsinghpur, Kendrapara',
      status: 'DISPATCHED',
      recipientsCount: 420000,
      channels: ['CAP Alerting', 'Cell Broadcast', 'Disaster Siren Towers', 'VHF Radio', 'SMS'],
      approvedBy: 'Emergency Operations Officer (Verified)',
    };
    setDispatchLogs([newRecord, ...dispatchLogs]);
  };

  // Prepare Chart Data for Impact Metrics
  const timelineChartData = allPoints.map((pt) => ({
    time: pt.hour < 0 ? `T${pt.hour}h` : pt.hour === 0 ? 'T-0' : `T+${pt.hour}`,
    windSpeed: pt.windSpeedKt,
    surge: Number((Math.pow(pt.windSpeedKt / 100, 2.15) * 1.8).toFixed(1)),
  }));

  const districtExposureData = districtRisks.map((d) => ({
    name: d.name,
    exposedPop: Math.round(d.populationAtRisk / 1000),
    shelterCap: 45, // in thousands
  }));

  const totalExposedPop = districtRisks.reduce((acc, d) => acc + d.populationAtRisk, 0);
  const totalPayout = insurancePolicies
    .filter((p) => p.status === 'TRIGGERED')
    .reduce((acc, p) => acc + p.estimatedPayoutCr, 0);
  const compromisedShelters = assets.filter(
    (a) => a.type === 'shelter' && (a.status === 'inundated' || a.status === 'overloaded')
  ).length;

  return (
    <div className="w-full lg:w-96 xl:w-[450px] flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 overflow-y-auto shrink-0 select-none">
      {/* 1. Tabs Header */}
      <div className="bg-slate-950/80 border-b border-slate-800 sticky top-0 z-20 flex overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('briefing')}
          className={`px-3 py-2.5 text-xs font-mono font-medium flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
            activeTab === 'briefing'
              ? 'text-cyan-400 border-cyan-400 bg-cyan-950/30'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Briefing
        </button>

        <button
          onClick={() => setActiveTab('evacuation')}
          className={`px-3 py-2.5 text-xs font-mono font-medium flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
            activeTab === 'evacuation'
              ? 'text-amber-400 border-amber-400 bg-amber-950/30'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" /> Copilot
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3 py-2.5 text-xs font-mono font-medium flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
            activeTab === 'alerts'
              ? 'text-rose-400 border-rose-400 bg-rose-950/30'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" /> Alerts
        </button>

        <button
          onClick={() => setActiveTab('insurance')}
          className={`px-3 py-2.5 text-xs font-mono font-medium flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
            activeTab === 'insurance'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-950/30'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" /> Triggers
        </button>

        <button
          onClick={() => setActiveTab('hardening')}
          className={`px-3 py-2.5 text-xs font-mono font-medium flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
            activeTab === 'hardening'
              ? 'text-purple-400 border-purple-400 bg-purple-950/30'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" /> Hardening
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`px-3 py-2.5 text-xs font-mono font-medium flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
            activeTab === 'impact'
              ? 'text-blue-400 border-blue-400 bg-blue-950/30'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Metrics
        </button>
      </div>

      {/* Mandatory Decision Support Sticky Banner */}
      <div className="bg-amber-950/50 border-b border-amber-900/60 px-3 py-1.5 text-[11px] text-amber-300 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-sans font-medium">
          Decision support. Human approval required before dispatch.
        </span>
      </div>

      {/* 2. Tab Contents */}
      <div className="p-4 space-y-4 flex-1">
        {/* TAB 1: AI BRIEFING */}
        {activeTab === 'briefing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Synthesized Situation Summary
              </span>
              <button
                onClick={generateAIBriefing}
                disabled={isGeneratingBriefing}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 transition disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isGeneratingBriefing ? 'animate-spin' : ''}`} />
                <span>{isGeneratingBriefing ? 'Synthesizing...' : 'Refresh AI'}</span>
              </button>
            </div>

            {/* Confidence Badge */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Model Confidence:</span>
                <span className="font-bold text-emerald-300">{briefing.confidenceLabel}</span>
              </div>
              <span className="font-mono font-bold text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                {briefing.confidence}%
              </span>
            </div>

            {/* Narrative Summary */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs leading-relaxed text-slate-200 font-sans shadow-sm">
              <p>{briefing.summary}</p>
            </div>

            {/* Evidence Bullets */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase text-slate-400">
                Grounded Telemetry Evidence:
              </div>
              <div className="space-y-1.5">
                {briefing.evidenceBullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-950/40 border border-slate-800/80 text-[10px] text-slate-500 font-mono">
              Model: gemini-3.8-flash | Source Data: Hydrodynamic Inundation + IMD Track Telemetry
            </div>
          </div>
        )}

        {/* TAB 2: EVACUATION COPILOT */}
        {activeTab === 'evacuation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Navigation className="w-4 h-4" /> Priority Evacuation Orders
              </span>
              <button
                onClick={generateAIEvacuation}
                disabled={isGeneratingEvacuation}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700 transition disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isGeneratingEvacuation ? 'animate-spin' : ''}`} />
                <span>{isGeneratingEvacuation ? 'Evaluating...' : 'Re-evaluate'}</span>
              </button>
            </div>

            {/* Road Alert Banner */}
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-rose-300 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Corridors & Reroute Advisory
              </div>
              <p className="text-[11px] leading-relaxed">{evacuationPlan.rerouteAdvise}</p>
            </div>

            {/* Compromised Shelter Flagging */}
            {evacuationPlan.shelterAlerts && evacuationPlan.shelterAlerts.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-bold uppercase text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Flagged Compromised Shelters
                </div>
                <div className="space-y-1.5">
                  {evacuationPlan.shelterAlerts.map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-rose-900/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-rose-300">{s.name}</strong>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
                          {s.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Reason: <span className="text-slate-200">{s.issue}</span> (Cap: {s.capacity})
                      </div>
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <ArrowRight className="w-3 h-3" /> Alternate Shelter: {s.rerouteTo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prioritized Action Cards */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono font-bold uppercase text-slate-400">
                Directives by Urgency:
              </div>
              {evacuationPlan.actions.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{act.target}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        act.priority === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {act.priority}
                    </span>
                  </div>

                  <p className="text-slate-300 font-medium">{act.action}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900 text-slate-400">
                    <div>
                      Deadline: <strong className="text-white font-mono">{act.deadline}</strong>
                    </div>
                    <div>
                      Assigned: <strong className="text-slate-200">{act.assignedShelters}</strong>
                    </div>
                  </div>

                  <div className="p-1.5 rounded bg-slate-900/80 text-[10px] text-cyan-300 font-mono">
                    Route: {act.route}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MULTILINGUAL ALERTS & HUMAN APPROVAL */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {/* Language Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <BellRing className="w-4 h-4" /> Advisory Broadcast
              </span>

              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-sans focus:outline-none"
              >
                <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
              </select>
            </div>

            {/* Approval Workflow State Banner */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Authorization State:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold tracking-wide uppercase ${
                  alertWorkflowStatus === 'DISPATCHED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : alertWorkflowStatus === 'APPROVED'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}
              >
                {alertWorkflowStatus === 'DRAFT'
                  ? 'Draft (Pending Verification)'
                  : alertWorkflowStatus === 'APPROVED'
                  ? 'Approved (Ready to Dispatch)'
                  : 'Dispatched to Public Gateways'}
              </span>
            </div>

            {/* Low-Literacy Alert Message Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/60 shadow-lg space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <h3 className="font-bold text-sm text-rose-300 leading-snug">
                    {currentAlert.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{currentAlert.leadTime}</p>
                </div>
                <button
                  onClick={handleListenAlert}
                  className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition ${
                    isPlayingAudio
                      ? 'bg-rose-900 text-white border-rose-600 animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700'
                  }`}
                  title="Listen in selected language using Text-To-Speech"
                >
                  {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isPlayingAudio ? 'Stop' : 'Listen'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {currentAlert.content}
              </p>

              {/* Action Rules */}
              <div className="space-y-1.5 pt-2 border-t border-slate-900">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Immediate Life-Safety Directives:
                </div>
                {currentAlert.keyRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-slate-900/80 text-xs text-slate-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>

              {/* Helpline Quick Dial */}
              <div className="flex items-center justify-between p-2 rounded bg-rose-950/40 border border-rose-900/80 text-xs text-rose-300 font-mono">
                <span className="flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5" /> Emergency Toll-Free:
                </span>
                <span className="font-bold">1070 (State) / 1077 (District)</span>
              </div>
            </div>

            {/* Workflow Approval & Dispatch Buttons */}
            <div className="flex gap-2">
              {alertWorkflowStatus === 'DRAFT' && (
                <button
                  onClick={handleApproveAlert}
                  className="flex-1 py-2 text-xs font-mono font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center gap-1.5 shadow"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Advisory
                </button>
              )}

              {alertWorkflowStatus === 'APPROVED' && (
                <button
                  onClick={handleDispatchAlert}
                  className="flex-1 py-2 text-xs font-mono font-bold rounded bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center gap-1.5 shadow animate-pulse"
                >
                  <Send className="w-4 h-4" /> Dispatch Public Broadcast
                </button>
              )}

              {alertWorkflowStatus === 'DISPATCHED' && (
                <button
                  onClick={() => setAlertWorkflowStatus('DRAFT')}
                  className="flex-1 py-2 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  Prepare New Revision
                </button>
              )}
            </div>

            {/* Dispatch Audit Log */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-mono font-bold uppercase text-slate-400">
                Public Alert Dispatch Log ({dispatchLogs.length})
              </div>
              <div className="space-y-1.5">
                {dispatchLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-300 font-bold">{log.timestamp}</span>
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                        {log.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Channel: {log.channels.join(', ')} ({log.recipientsCount.toLocaleString()} devices)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Auth: {log.approvedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PARAMETRIC INSURANCE TRIGGERS */}
        {activeTab === 'insurance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4" /> Parametric Payout Triggers
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Total Est: ₹{totalPayout} Cr
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Automatic anticipatory payouts fire when wind, rainfall, or storm surge thresholds are breached, accelerating liquidity for immediate shelter stocking and road clearance.
            </p>

            {/* Policy Cards */}
            <div className="space-y-2.5">
              {insurancePolicies.map((pol) => {
                const isTriggered = pol.status === 'TRIGGERED';

                return (
                  <div
                    key={pol.district}
                    className={`p-3 rounded-xl border text-xs space-y-2 transition ${
                      isTriggered
                        ? 'bg-rose-950/40 border-rose-700 shadow-md'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">{pol.district} District</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isTriggered
                            ? 'bg-rose-900 text-rose-200 border border-rose-600 animate-pulse'
                            : 'bg-slate-800 text-emerald-400 border border-slate-700'
                        }`}
                      >
                        {pol.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-slate-400">
                      <div>
                        Wind: <strong className="text-slate-200">{pol.windThresholdKt} kt</strong>
                      </div>
                      <div>
                        Rain: <strong className="text-slate-200">{pol.rainThresholdMm} mm</strong>
                      </div>
                      <div>
                        Surge: <strong className="text-slate-200">{pol.surgeThresholdM} m</strong>
                      </div>
                    </div>

                    {isTriggered && (
                      <div className="p-2 rounded bg-rose-950/80 border border-rose-800/80 text-[11px] text-rose-200 space-y-1 font-mono">
                        <div>Triggered by: {pol.triggeredFactors.join(' & ')}</div>
                        <div className="font-bold text-rose-300">
                          Automated Payout Authorized: ₹{pol.maxPayoutCr} Crore
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Audit Log */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-mono font-bold uppercase text-slate-400">
                Immutable Parametric Trigger Audit Log
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="text-[11px] text-slate-400 border-b border-slate-900 pb-1">
                    <span className="text-cyan-400">[{log.timestamp}]</span> {log.district}: {log.reason}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HARDENING RANKER */}
        {activeTab === 'hardening' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Wrench className="w-4 h-4" /> Asset Hardening Priority
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ranked by Ensemble Exposure</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Infrastructure prioritized by repeated surge inundation probability across all 4 track scenarios, paired with immediate mitigation actions.
            </p>

            <div className="space-y-2.5">
              {hardeningItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 flex items-center justify-center font-mono font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <strong className="text-slate-100">{item.name}</strong>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.priority === 'P1_CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Multi-Scenario Exposure: <strong className="text-purple-300">{item.exposureFrequencyPct}%</strong></span>
                    <span>Peak Depth: <strong className="text-rose-400">{item.projectedPeakDepthM}m</strong></span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded border border-slate-800">
                    <strong className="text-cyan-300">Action:</strong> {item.recommendedAction}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>Est Cost: ₹{item.estHardeningCostLakhs} L</span>
                    <span className="text-emerald-400 font-bold">Avoided Loss: ₹{item.avoidedLossCr} Cr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: IMPACT METRICS */}
        {activeTab === 'impact' && (
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" /> Anticipatory Impact Metrics
            </span>

            {/* 4 Metric KPI Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Population at Risk</span>
                <div className="text-lg font-bold font-mono text-rose-400">
                  {(totalExposedPop / 1000).toFixed(0)}k
                </div>
                <span className="text-[10px] text-slate-500">In &gt;1.0m surge zones</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Lead Time Gained</span>
                <div className="text-lg font-bold font-mono text-cyan-400">
                  {Math.abs(currentPoint.hour)} hrs
                </div>
                <span className="text-[10px] text-slate-500">Anticipatory window</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Shelters Flagged</span>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {compromisedShelters} / {assets.filter((a) => a.type === 'shelter').length}
                </div>
                <span className="text-[10px] text-slate-500">Inundated / overloaded</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Loss Avoided</span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  ₹320 Cr
                </div>
                <span className="text-[10px] text-slate-500">Early asset shutdown</span>
              </div>
            </div>

            {/* Recharts 1: Wind Speed & Surge Progression */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                Storm Intensity & Surge Progression
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="windSpeed"
                      stroke="#f59e0b"
                      name="Wind (kt)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="surge"
                      stroke="#ef4444"
                      name="Surge (m)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recharts 2: Population Exposed by District */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                Exposed Population vs Shelter Capacity (Thousands)
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtExposureData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="exposedPop" fill="#ef4444" name="Exposed (k)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="shelterCap" fill="#10b981" name="Capacity (k)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
