export interface TrackPoint {
  id: string;
  hour: number; // e.g. -72, -60, -48, -36, -24, -18, -12, -6, 0, 6
  timeLabel: string; // e.g. "T-48h (01 May, 08:30 IST)"
  lat: number;
  lng: number;
  windSpeedKt: number;
  windSpeedKmh: number;
  pressureHpa: number;
  category: string;
  stormRadiusKm: number;
}

export type AssetType = 'hospital' | 'shelter' | 'substation';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  district: string;
  lat: number;
  lng: number;
  elevationM: number;
  capacity?: number;
  currentOccupancy?: number;
  description: string;
  backupPower: boolean;
  status?: 'operational' | 'at-risk' | 'inundated' | 'overloaded';
  computedSurgeDepth?: number;
}

export interface KeyRoad {
  id: string;
  name: string;
  code: string;
  district: string;
  coordinates: [number, number][]; // [lat, lng][]
  elevationM: number;
  criticality: 'PRIMARY_CORRIDOR' | 'COASTAL_LINK' | 'PORT_HIGHWAY';
  status?: 'passable' | 'caution' | 'inundated';
  computedWaterDepth?: number;
}

export interface SurgePolygon {
  id: string;
  district: string;
  coordinates: [number, number][];
  baseElevationM: number;
  riskLevel: 'GREEN' | 'AMBER' | 'ORANGE' | 'RED';
  depthM: number;
  label: string;
}

export interface AlternateTrack {
  id: string;
  name: string;
  agency: string;
  color: string;
  probability: number;
  points: [number, number][];
}

export interface DistrictRisk {
  name: string;
  probOver1m: number;
  projectedSurgeM: number;
  populationAtRisk: number;
  cycloneWarning: 'YELLOW' | 'ORANGE' | 'RED';
}

export interface InsurancePolicy {
  district: string;
  windThresholdKt: number;
  rainThresholdMm: number;
  surgeThresholdM: number;
  maxPayoutCr: number;
  status: 'ARMED' | 'TRIGGERED' | 'NORMAL';
  estimatedPayoutCr: number;
  triggeredFactors: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  district: string;
  triggerType: string;
  conditionMet: string;
  payoutAmountCr: number;
  authorizedBy: string;
}

export interface HardeningItem {
  id: string;
  name: string;
  type: 'SUBSTATION' | 'CULVERT' | 'ROAD_EMBANKMENT' | 'PUMPING_STATION';
  district: string;
  exposureFrequencyPct: number; // e.g. 95% of scenarios
  projectedPeakDepthM: number;
  recommendedAction: string;
  priority: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MODERATE';
  estHardeningCostLakhs: number;
  avoidedLossCr: number;
}

export interface AlertDispatchRecord {
  id: string;
  timestamp: string;
  language: string;
  targetArea: string;
  status: 'DRAFT' | 'APPROVED' | 'DISPATCHED';
  recipientsCount: number;
  channels: string[];
  approvedBy?: string;
}
