import { SurgePolygon, Asset, KeyRoad, DistrictRisk } from '../types';

export interface ModelParameters {
  windSpeedKt: number;
  tideLevelM: number; // -0.5 to +1.8m
  landfallLat: number;
  landfallLng: number;
  currentLat: number;
  currentLng: number;
  hour: number;
}

// Haversine distance in kilometers
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Core surge height formula: surge = f(windSpeed, distanceToLandfall, tideLevel, elevation)
export function computeSurgeDepth(
  windSpeedKt: number,
  distToLandfallKm: number,
  tideLevelM: number,
  elevationM: number
): { surgeHeightM: number; depthM: number; riskLevel: 'GREEN' | 'AMBER' | 'ORANGE' | 'RED' } {
  // Peak wind surge potential (hydrodynamic approximation)
  const normalizedWind = Math.max(40, windSpeedKt) / 100;
  const windSurgeBase = Math.pow(normalizedWind, 2.15) * 2.5;

  // Asymmetry & decay with distance to landfall center
  // Maximum surge typically occurs 20-50 km right of landfall track in Northern Hemisphere
  const distanceDecay = Math.exp(-Math.pow(distToLandfallKm / 85, 1.4));

  // Pure sea surface surge elevation above mean sea level
  const totalWaterLevel = Math.max(0, windSurgeBase * distanceDecay + tideLevelM);

  // Inundation depth over dry ground elevation
  const depthM = Math.max(0, totalWaterLevel - elevationM);

  let riskLevel: 'GREEN' | 'AMBER' | 'ORANGE' | 'RED' = 'GREEN';
  if (depthM >= 3.0) {
    riskLevel = 'RED';
  } else if (depthM >= 1.5) {
    riskLevel = 'ORANGE';
  } else if (depthM >= 0.5) {
    riskLevel = 'AMBER';
  } else {
    riskLevel = 'GREEN';
  }

  return {
    surgeHeightM: Number(totalWaterLevel.toFixed(2)),
    depthM: Number(depthM.toFixed(2)),
    riskLevel,
  };
}

// 8 Distinct Coastal Zones along Odisha Coast
interface CoastalZoneConfig {
  id: string;
  name: string;
  district: string;
  centroid: [number, number];
  baseElevationM: number;
  basePolygon: [number, number][];
}

const COASTAL_ZONES: CoastalZoneConfig[] = [
  // 1. Puri Beach & Pentakota Shoreline
  {
    id: 'zone-puri-beach',
    name: 'Puri Town & Pentakota Coastal Belt',
    district: 'Puri',
    centroid: [19.795, 85.815],
    baseElevationM: 1.6,
    basePolygon: [
      [19.780, 85.780],
      [19.815, 85.800],
      [19.835, 85.860],
      [19.810, 85.870],
      [19.785, 85.830],
      [19.775, 85.795],
    ],
  },
  // 2. Puri-Konark Marine Drive Lowland Dunes
  {
    id: 'zone-marine-drive',
    name: 'Marine Drive & Balukhand Wildlife Strip',
    district: 'Puri',
    centroid: [19.845, 85.980],
    baseElevationM: 1.4,
    basePolygon: [
      [19.815, 85.870],
      [19.855, 85.930],
      [19.880, 86.030],
      [19.865, 86.070],
      [19.835, 85.980],
      [19.810, 85.900],
    ],
  },
  // 3. Chandrabhaga & Kushabhadra Estuary
  {
    id: 'zone-chandrabhaga',
    name: 'Chandrabhaga Coast & Kushabhadra Mouth',
    district: 'Puri',
    centroid: [19.875, 86.110],
    baseElevationM: 1.8,
    basePolygon: [
      [19.860, 86.070],
      [19.895, 86.100],
      [19.920, 86.160],
      [19.890, 86.180],
      [19.865, 86.130],
    ],
  },
  // 4. Astaranga & Devi River Mouth
  {
    id: 'zone-astaranga',
    name: 'Astaranga & Devi River Delta',
    district: 'Puri',
    centroid: [19.970, 86.270],
    baseElevationM: 1.5,
    basePolygon: [
      [19.910, 86.180],
      [19.960, 86.230],
      [20.020, 86.330],
      [19.980, 86.360],
      [19.930, 86.280],
    ],
  },
  // 5. Chilika Satapada Lagoon Ingress
  {
    id: 'zone-satapada',
    name: 'Satapada Chilika Mouth & Sipakuda Barrier',
    district: 'Puri',
    centroid: [19.670, 85.450],
    baseElevationM: 1.2,
    basePolygon: [
      [19.620, 85.380],
      [19.680, 85.420],
      [19.720, 85.520],
      [19.680, 85.560],
      [19.640, 85.460],
    ],
  },
  // 6. Jagatsinghpur - Paradip Port Coast
  {
    id: 'zone-paradip',
    name: 'Paradip Port & Ersama Lowlands',
    district: 'Jagatsinghpur',
    centroid: [20.270, 86.640],
    baseElevationM: 1.9,
    basePolygon: [
      [20.210, 86.520],
      [20.280, 86.580],
      [20.340, 86.710],
      [20.280, 86.740],
      [20.230, 86.620],
    ],
  },
  // 7. Kendrapara - Rajnagar & Bhitarkanika
  {
    id: 'zone-kendrapara',
    name: 'Rajnagar & Bhitarkanika Outer Mudflats',
    district: 'Kendrapara',
    centroid: [20.620, 86.760],
    baseElevationM: 2.2,
    basePolygon: [
      [20.480, 86.680],
      [20.590, 86.720],
      [20.730, 86.880],
      [20.670, 86.920],
      [20.520, 86.780],
    ],
  },
  // 8. Ganjam - Rushikulya River Mouth & Gopalpur
  {
    id: 'zone-ganjam',
    name: 'Rushikulya Estuary & Ganjam Coast',
    district: 'Ganjam',
    centroid: [19.340, 85.020],
    baseElevationM: 2.4,
    basePolygon: [
      [19.260, 84.920],
      [19.340, 84.990],
      [19.420, 85.120],
      [19.360, 85.180],
      [19.290, 85.040],
    ],
  },
];

// Generate active surge polygons computed live
export function computeSurgePolygons(params: ModelParameters): SurgePolygon[] {
  return COASTAL_ZONES.map((zone) => {
    // Distance from zone centroid to effective landfall or storm eye
    const distToLandfall = getDistanceKm(
      zone.centroid[0],
      zone.centroid[1],
      params.landfallLat,
      params.landfallLng
    );

    // Timeline factor: peak surge occurs around landfall (hour -12 to +3)
    let timelineFactor = 1.0;
    if (params.hour < -24) {
      timelineFactor = Math.max(0.4, 1 - Math.abs(params.hour + 24) * 0.015);
    } else if (params.hour > 6) {
      timelineFactor = Math.max(0.3, 1 - (params.hour - 6) * 0.08);
    }

    const effectiveWind = params.windSpeedKt * timelineFactor;
    const { depthM, riskLevel } = computeSurgeDepth(
      effectiveWind,
      distToLandfall,
      params.tideLevelM,
      zone.baseElevationM
    );

    return {
      id: zone.id,
      district: zone.district,
      coordinates: zone.basePolygon,
      baseElevationM: zone.baseElevationM,
      riskLevel,
      depthM,
      label: `${zone.name}: ${depthM.toFixed(1)}m inundation`,
    };
  });
}

// Compute asset risk statuses live
export function updateAssetStatus(assets: Asset[], params: ModelParameters): Asset[] {
  return assets.map((asset) => {
    const distToLandfall = getDistanceKm(
      asset.lat,
      asset.lng,
      params.landfallLat,
      params.landfallLng
    );

    const { depthM } = computeSurgeDepth(
      params.windSpeedKt,
      distToLandfall,
      params.tideLevelM,
      asset.elevationM
    );

    let status: Asset['status'] = 'operational';
    if (depthM > 1.2) {
      status = 'inundated';
    } else if (depthM > 0.2) {
      status = 'at-risk';
    }

    // Check capacity if shelter
    if (asset.type === 'shelter' && asset.capacity && asset.currentOccupancy) {
      if (asset.currentOccupancy >= asset.capacity * 0.95 && status === 'operational') {
        status = 'overloaded';
      }
    }

    return {
      ...asset,
      computedSurgeDepth: depthM,
      status,
    };
  });
}

// Compute road inundation status live
export function updateRoadStatus(roads: KeyRoad[], params: ModelParameters): KeyRoad[] {
  return roads.map((road) => {
    // Check maximum depth along road vertices
    let maxDepth = 0;
    for (const [lat, lng] of road.coordinates) {
      const dist = getDistanceKm(lat, lng, params.landfallLat, params.landfallLng);
      const { depthM } = computeSurgeDepth(
        params.windSpeedKt,
        dist,
        params.tideLevelM,
        road.elevationM
      );
      if (depthM > maxDepth) maxDepth = depthM;
    }

    let status: KeyRoad['status'] = 'passable';
    if (maxDepth >= 0.45) {
      status = 'inundated'; // Closed / blocked
    } else if (maxDepth >= 0.15) {
      status = 'caution';
    }

    return {
      ...road,
      computedWaterDepth: Number(maxDepth.toFixed(2)),
      status,
    };
  });
}

// Compute District Inundation Probability Table
export function computeDistrictRisks(params: ModelParameters): DistrictRisk[] {
  const districts = [
    { name: 'Puri', baseProb: 88, pop: 480000, centroidLat: 19.81, centroidLng: 85.83 },
    { name: 'Jagatsinghpur', baseProb: 74, pop: 340000, centroidLat: 20.27, centroidLng: 86.40 },
    { name: 'Kendrapara', baseProb: 52, pop: 220000, centroidLat: 20.50, centroidLng: 86.42 },
    { name: 'Ganjam', baseProb: 31, pop: 180000, centroidLat: 19.38, centroidLng: 85.05 },
    { name: 'Bhadrak', baseProb: 44, pop: 140000, centroidLat: 20.88, centroidLng: 86.75 },
    { name: 'Khordha', baseProb: 22, pop: 95000, centroidLat: 20.20, centroidLng: 85.75 },
  ];

  return districts.map((d) => {
    const distToLandfall = getDistanceKm(
      d.centroidLat,
      d.centroidLng,
      params.landfallLat,
      params.landfallLng
    );

    // Probability adjustment based on wind speed and tide
    const windMultiplier = params.windSpeedKt / 120;
    const tideDelta = params.tideLevelM * 12;
    const distMultiplier = Math.exp(-distToLandfall / 110);

    const calculatedProb = Math.min(
      99,
      Math.max(5, Math.round(d.baseProb * windMultiplier * distMultiplier + tideDelta))
    );

    const projectedSurge = Number(
      Math.max(0.3, Math.min(4.8, (params.windSpeedKt / 100) * 2.2 * distMultiplier + params.tideLevelM)).toFixed(1)
    );

    const exposedPop = Math.round(d.pop * (calculatedProb / 100));

    let cycloneWarning: 'YELLOW' | 'ORANGE' | 'RED' = 'YELLOW';
    if (calculatedProb >= 70 || projectedSurge >= 2.0) {
      cycloneWarning = 'RED';
    } else if (calculatedProb >= 40 || projectedSurge >= 1.0) {
      cycloneWarning = 'ORANGE';
    }

    return {
      name: d.name,
      probOver1m: calculatedProb,
      projectedSurgeM: projectedSurge,
      populationAtRisk: exposedPop,
      cycloneWarning,
    };
  });
}

// Uncertainty cone coordinates polygon
export function generateUncertaintyCone(
  startLat: number,
  startLng: number,
  targetLat: number,
  targetLng: number
): [number, number][] {
  // Angle of track
  const dLat = targetLat - startLat;
  const dLng = targetLng - startLng;
  const length = Math.sqrt(dLat * dLat + dLng * dLng);

  if (length === 0) return [];

  // Perpendicular vector
  const pLat = -dLng / length;
  const pLng = dLat / length;

  // Cone spread widens toward landfall
  const spreadEnd = 0.55; // degrees (~60km spread)

  const leftPoint: [number, number] = [targetLat + pLat * spreadEnd, targetLng + pLng * spreadEnd];
  const rightPoint: [number, number] = [targetLat - pLat * spreadEnd, targetLng - pLng * spreadEnd];

  return [
    [startLat, startLng],
    leftPoint,
    [targetLat + 0.15, targetLng + 0.15],
    rightPoint,
    [startLat, startLng],
  ];
}

// 4 Major River Basin Delta Flood Zones for Rainfall Flood Overlay
export const RAINFALL_FLOOD_ZONES = [
  {
    id: 'rf-mahanadi',
    name: 'Mahanadi Lower Delta Floodplain',
    coordinates: [
      [20.35, 85.90],
      [20.48, 86.15],
      [20.42, 86.50],
      [20.25, 86.45],
      [20.22, 86.05],
    ] as [number, number][],
    risk: 'High Pluvial Flood Risk (350mm/24h)',
  },
  {
    id: 'rf-kushabhadra',
    name: 'Kushabhadra & Bhargavi River Basin',
    coordinates: [
      [19.88, 85.85],
      [20.10, 85.88],
      [20.12, 86.12],
      [19.92, 86.15],
    ] as [number, number][],
    risk: 'Backwater Ingress & Breaching Risk',
  },
  {
    id: 'rf-brahmani',
    name: 'Brahmani - Baitarani Delta (Kendrapara)',
    coordinates: [
      [20.55, 86.35],
      [20.72, 86.60],
      [20.65, 86.85],
      [20.45, 86.60],
    ] as [number, number][],
    risk: 'Moderate Riverine Flooding',
  },
];
