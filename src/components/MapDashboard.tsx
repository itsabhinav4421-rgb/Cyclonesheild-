import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Waves,
  CloudRain,
  Eye,
  ShieldAlert,
  HelpCircle,
  Building,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react';
import { TrackPoint, Asset, KeyRoad, SurgePolygon, AlternateTrack } from '../types';
import { RAINFALL_FLOOD_ZONES, generateUncertaintyCone } from '../utils/surgeModel';

interface MapDashboardProps {
  currentPoint: TrackPoint;
  allPoints: TrackPoint[];
  assets: Asset[];
  roads: KeyRoad[];
  surgePolygons: SurgePolygon[];
  alternateTracks: AlternateTrack[];
  landfallPos: { lat: number; lng: number };
  onLandfallChange: (lat: number, lng: number) => void;
  windSpeedKt: number;
}

export const MapDashboard: React.FC<MapDashboardProps> = ({
  currentPoint,
  allPoints,
  assets,
  roads,
  surgePolygons,
  alternateTracks,
  landfallPos,
  onLandfallChange,
  windSpeedKt,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs to easily add/clear without re-instantiating the map
  const surgeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const rainfallLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const assetsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const roadsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const trackLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const scenariosLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const landfallMarkerRef = useRef<L.Marker | null>(null);

  // Layer Visibility State
  const [showSurge, setShowSurge] = useState(true);
  const [showRainfall, setShowRainfall] = useState(false);
  const [showAssets, setShowAssets] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showTrack, setShowTrack] = useState(true);
  const [showScenarios, setShowScenarios] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // 1. Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const container = mapContainerRef.current;
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    // Centered along Odisha Coast (Puri / Chilika / Paradip corridor)
    const map = L.map(container, {
      center: [19.95, 85.95],
      zoom: 8,
      minZoom: 6,
      maxZoom: 14,
      zoomControl: false,
    });

    // Invalidate size after layout renders
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Custom dark control room tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Initialize Layer Groups
    surgeLayerGroupRef.current = L.layerGroup().addTo(map);
    rainfallLayerGroupRef.current = L.layerGroup().addTo(map);
    roadsLayerGroupRef.current = L.layerGroup().addTo(map);
    assetsLayerGroupRef.current = L.layerGroup().addTo(map);
    scenariosLayerGroupRef.current = L.layerGroup().addTo(map);
    trackLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      if (container) {
        delete (container as any)._leaflet_id;
      }
    };
  }, []);

  // 2. Render Draggable Landfall Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (landfallMarkerRef.current) {
      landfallMarkerRef.current.remove();
    }

    const landfallHtml = `
      <div class="relative flex items-center justify-center cursor-move group">
        <div class="absolute w-8 h-8 rounded-full bg-red-600/30 animate-ping"></div>
        <div class="w-7 h-7 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white shadow-lg text-[11px] font-bold">
          🎯
        </div>
        <div class="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900/90 border border-red-500/80 text-[10px] text-red-300 font-mono font-bold pointer-events-none shadow">
          LANDFALL (DRAG ME)
        </div>
      </div>
    `;

    const landfallIcon = L.divIcon({
      html: landfallHtml,
      className: 'custom-landfall-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([landfallPos.lat, landfallPos.lng], {
      icon: landfallIcon,
      draggable: true,
      zIndexOffset: 1000,
    }).addTo(map);

    marker.on('dragend', (e) => {
      const newPos = (e.target as L.Marker).getLatLng();
      onLandfallChange(Number(newPos.lat.toFixed(3)), Number(newPos.lng.toFixed(3)));
    });

    marker.bindPopup(`
      <div class="p-2 text-slate-900 font-sans text-xs">
        <strong class="text-red-700 block font-bold text-sm mb-1">🎯 What-If Landfall Point</strong>
        <p class="mb-1 text-slate-700">Coordinates: <strong>${landfallPos.lat.toFixed(2)}°N, ${landfallPos.lng.toFixed(2)}°E</strong></p>
        <p class="text-[11px] text-slate-500">Drag this pin along the coastline to simulate landfall shift scenarios.</p>
      </div>
    `);

    landfallMarkerRef.current = marker;

    return () => {
      if (landfallMarkerRef.current) {
        landfallMarkerRef.current.remove();
      }
    };
  }, [landfallPos.lat, landfallPos.lng, onLandfallChange]);

  // 3. Render Storm Surge Inundation Polygons
  useEffect(() => {
    const group = surgeLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showSurge) return;

    surgePolygons.forEach((poly) => {
      let fillColor = '#10b981'; // Green
      let strokeColor = '#059669';
      let fillOpacity = 0.35;

      if (poly.riskLevel === 'RED') {
        fillColor = '#ef4444';
        strokeColor = '#b91c1c';
        fillOpacity = 0.7;
      } else if (poly.riskLevel === 'ORANGE') {
        fillColor = '#f97316';
        strokeColor = '#c2410c';
        fillOpacity = 0.55;
      } else if (poly.riskLevel === 'AMBER') {
        fillColor = '#f59e0b';
        strokeColor = '#d97706';
        fillOpacity = 0.45;
      }

      const polygon = L.polygon(poly.coordinates, {
        color: strokeColor,
        weight: 1.5,
        fillColor,
        fillOpacity,
      });

      polygon.bindPopup(`
        <div class="p-2 font-sans text-xs text-slate-900">
          <div class="flex items-center gap-1.5 font-bold text-sm text-slate-950 mb-1 border-b pb-1">
            <span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color: ${fillColor}"></span>
            ${poly.district} Inundation Zone
          </div>
          <div class="space-y-1 text-slate-700">
            <div>Projected Inundation Depth: <strong class="text-rose-700 text-sm font-mono">${poly.depthM.toFixed(1)} m</strong></div>
            <div>Risk Category: <span class="px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase" style="background-color: ${fillColor}">${poly.riskLevel}</span></div>
            <div>Base Elevation: <strong>${poly.baseElevationM} m</strong> above MSL</div>
          </div>
        </div>
      `);

      polygon.addTo(group);
    });
  }, [surgePolygons, showSurge]);

  // 4. Render Rainfall Flood Zones
  useEffect(() => {
    const group = rainfallLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showRainfall) return;

    RAINFALL_FLOOD_ZONES.forEach((rf) => {
      const polygon = L.polygon(rf.coordinates, {
        color: '#06b6d4',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#0891b2',
        fillOpacity: 0.35,
      });

      polygon.bindPopup(`
        <div class="p-2 font-sans text-xs text-slate-900">
          <strong class="text-cyan-800 text-sm block mb-1">🌧️ ${rf.name}</strong>
          <p class="text-slate-600 mb-1 font-medium">${rf.risk}</p>
          <p class="text-[11px] text-slate-500">Riverine discharge + tidal lock exacerbation.</p>
        </div>
      `);

      polygon.addTo(group);
    });
  }, [showRainfall]);

  // 5. Render Key Roads
  useEffect(() => {
    const group = roadsLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showRoads) return;

    roads.forEach((road) => {
      let color = '#22c55e'; // Green passable
      let weight = 4;
      let dashArray = undefined;

      if (road.status === 'inundated') {
        color = '#ef4444'; // Red blocked
        weight = 5;
        dashArray = '6, 6';
      } else if (road.status === 'caution') {
        color = '#f59e0b'; // Amber caution
        weight = 4;
      }

      const polyline = L.polyline(road.coordinates, {
        color,
        weight,
        opacity: 0.9,
        dashArray,
      });

      polyline.bindPopup(`
        <div class="p-2 font-sans text-xs text-slate-900">
          <div class="font-bold text-sm text-slate-950 mb-1">${road.name}</div>
          <div class="space-y-1 text-slate-700">
            <div>Status: <strong class="${road.status === 'inundated' ? 'text-red-600 uppercase' : road.status === 'caution' ? 'text-amber-600 uppercase' : 'text-emerald-600 uppercase'} font-bold">${road.status}</strong></div>
            <div>Max Water Depth: <span class="font-mono font-bold">${road.computedWaterDepth ?? 0} m</span></div>
            <div>Corridor Role: <strong>${road.criticality}</strong></div>
            <div>Average Elevation: <strong>${road.elevationM} m</strong></div>
          </div>
          ${
            road.status === 'inundated'
              ? '<p class="mt-2 text-[11px] font-bold text-rose-700 bg-rose-50 p-1 rounded border border-rose-200">⛔ CLOSED: Use inland NH-316 alternate route.</p>'
              : ''
          }
        </div>
      `);

      polyline.addTo(group);
    });
  }, [roads, showRoads]);

  // 6. Render Critical Assets (Hospitals, Shelters, Substations)
  useEffect(() => {
    const group = assetsLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showAssets) return;

    assets.forEach((asset) => {
      let iconEmoji = '🏛️';
      let bgColor = 'bg-blue-600';
      let borderColor = 'border-blue-300';

      if (asset.type === 'hospital') {
        iconEmoji = '🏥';
        bgColor = 'bg-emerald-600';
        borderColor = 'border-emerald-300';
      } else if (asset.type === 'substation') {
        iconEmoji = '⚡';
        bgColor = 'bg-amber-600';
        borderColor = 'border-amber-300';
      }

      // Check status impact
      let pulseRing = '';
      if (asset.status === 'inundated') {
        bgColor = 'bg-rose-600';
        borderColor = 'border-rose-300';
        pulseRing = '<div class="absolute -inset-1 rounded-full bg-red-500/50 animate-ping"></div>';
      } else if (asset.status === 'overloaded') {
        bgColor = 'bg-purple-600';
        borderColor = 'border-purple-300';
      } else if (asset.status === 'at-risk') {
        bgColor = 'bg-amber-600';
        borderColor = 'border-amber-300';
      }

      const assetHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${pulseRing}
          <div class="w-6 h-6 rounded-full ${bgColor} border-2 ${borderColor} flex items-center justify-center text-xs shadow-md text-white">
            ${iconEmoji}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: assetHtml,
        className: 'custom-asset-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([asset.lat, asset.lng], { icon });

      marker.bindPopup(`
        <div class="p-2 font-sans text-xs text-slate-900 max-w-xs">
          <div class="font-bold text-sm text-slate-950 mb-1 flex items-center gap-1.5">
            <span>${iconEmoji}</span>
            <span>${asset.name}</span>
          </div>
          <div class="space-y-1 text-slate-700 text-[11px]">
            <div>District: <strong>${asset.district}</strong></div>
            <div>Elevation: <strong>${asset.elevationM} m</strong> above sea level</div>
            <div>Current Water Level: <strong class="font-mono ${(asset.computedSurgeDepth ?? 0) > 0.5 ? 'text-red-600' : 'text-slate-800'}">${asset.computedSurgeDepth ?? 0} m</strong></div>
            <div>Status: <span class="px-1.5 py-0.5 rounded font-bold uppercase ${asset.status === 'inundated' ? 'bg-red-100 text-red-700' : asset.status === 'at-risk' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">${asset.status}</span></div>
            ${asset.capacity ? `<div>Capacity: <strong>${asset.currentOccupancy ?? 0} / ${asset.capacity} persons</strong></div>` : ''}
            <div>Backup Power: <strong>${asset.backupPower ? '✅ Available' : '❌ None'}</strong></div>
          </div>
          <p class="mt-1.5 text-[10px] text-slate-500 border-t pt-1 italic">${asset.description}</p>
        </div>
      `);

      marker.addTo(group);
    });
  }, [assets, showAssets]);

  // 7. Render Cyclone Track, Eye & Cone of Uncertainty
  useEffect(() => {
    const group = trackLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showTrack) return;

    // Past points up to current
    const pastPoints = allPoints.filter((p) => p.hour <= currentPoint.hour);
    const futurePoints = allPoints.filter((p) => p.hour >= currentPoint.hour);

    // Draw past track (solid cyan)
    if (pastPoints.length > 1) {
      L.polyline(
        pastPoints.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: '#38bdf8',
          weight: 3.5,
          opacity: 0.9,
        }
      ).addTo(group);
    }

    // Draw forecast track to landfall (dashed red)
    if (futurePoints.length > 1) {
      L.polyline(
        futurePoints.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: '#ef4444',
          weight: 3,
          dashArray: '5, 5',
          opacity: 0.85,
        }
      ).addTo(group);
    }

    // Uncertainty Cone from current eye to landfall
    const coneCoords = generateUncertaintyCone(
      currentPoint.lat,
      currentPoint.lng,
      landfallPos.lat,
      landfallPos.lng
    );

    if (coneCoords.length > 0) {
      L.polygon(coneCoords, {
        color: '#f87171',
        weight: 1,
        dashArray: '3, 3',
        fillColor: '#ef4444',
        fillOpacity: 0.15,
      })
        .bindTooltip('Cone of Track Uncertainty (68% Confidence Band)', {
          sticky: true,
          className: 'text-xs bg-slate-900 text-white border-slate-700',
        })
        .addTo(group);
    }

    // Track historical point circle markers
    allPoints.forEach((pt) => {
      const isCurrent = pt.hour === currentPoint.hour;
      const isPast = pt.hour < currentPoint.hour;

      const circle = L.circleMarker([pt.lat, pt.lng], {
        radius: isCurrent ? 7 : 4,
        color: isCurrent ? '#facc15' : isPast ? '#38bdf8' : '#f87171',
        weight: isCurrent ? 3 : 1.5,
        fillColor: isCurrent ? '#ef4444' : isPast ? '#0284c7' : '#991b1b',
        fillOpacity: 0.9,
      });

      circle.bindPopup(`
        <div class="p-2 font-sans text-xs text-slate-900">
          <strong class="text-sm block font-bold text-slate-950 mb-1">${pt.timeLabel}</strong>
          <div class="space-y-0.5 text-slate-700">
            <div>Intensity: <strong>${pt.category}</strong></div>
            <div>Sustained Wind: <strong class="font-mono">${pt.windSpeedKt} kt (${pt.windSpeedKmh} km/h)</strong></div>
            <div>Central Pressure: <strong>${pt.pressureHpa} hPa</strong></div>
            <div>Eye Coordinates: <strong>${pt.lat}°N, ${pt.lng}°E</strong></div>
          </div>
        </div>
      `);

      circle.addTo(group);
    });

    // Storm Eye Pulse Marker
    const eyeHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 rounded-full bg-cyan-500/25 animate-ping"></div>
        <div class="w-8 h-8 rounded-full bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-sm shadow-xl shadow-cyan-950">
          🌀
        </div>
        <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-cyan-500/60 text-[9px] text-cyan-300 font-mono font-bold">
          ${currentPoint.hour >= 0 ? `T+${currentPoint.hour}h` : `T${currentPoint.hour}h`} (${windSpeedKt} kt)
        </div>
      </div>
    `;

    const eyeIcon = L.divIcon({
      html: eyeHtml,
      className: 'custom-eye-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([currentPoint.lat, currentPoint.lng], { icon: eyeIcon })
      .bindPopup(`
        <div class="p-2 font-sans text-xs text-slate-900">
          <strong class="text-sm font-bold text-cyan-800 block mb-1">Cyclone Center Eye</strong>
          <div>Current Wind Field: <strong>${windSpeedKt} knots</strong></div>
          <div>Location: <strong>${currentPoint.lat}°N, ${currentPoint.lng}°E</strong></div>
          <div>Pressure: <strong>${currentPoint.pressureHpa} hPa</strong></div>
        </div>
      `)
      .addTo(group);
  }, [allPoints, currentPoint, showTrack, landfallPos, windSpeedKt]);

  // 8. Render Alternate Scenario Tracks
  useEffect(() => {
    const group = scenariosLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showScenarios) return;

    alternateTracks.forEach((scen) => {
      const line = L.polyline(scen.points, {
        color: scen.color,
        weight: 2,
        dashArray: '4, 4',
        opacity: 0.75,
      });

      line.bindTooltip(`${scen.name} (${scen.probability}% ensemble prob)`, {
        sticky: true,
        className: 'text-xs bg-slate-900 text-slate-100 border-slate-700',
      });

      line.addTo(group);
    });
  }, [alternateTracks, showScenarios]);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 overflow-hidden flex flex-col">
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Layer Toggle Controls Floating Panel */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-xl text-xs text-slate-200 w-52">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-mono font-bold flex items-center gap-1.5 text-cyan-400">
              <Layers className="w-3.5 h-3.5" /> MAP LAYERS
            </span>
            <button
              onClick={() => setShowLegend(!showLegend)}
              title="Toggle Legend"
              className="text-[10px] text-slate-400 hover:text-white underline"
            >
              {showLegend ? 'Hide Legend' : 'Legend'}
            </button>
          </div>

          <div className="space-y-1.5 font-sans">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showSurge}
                onChange={(e) => setShowSurge(e.target.checked)}
                className="rounded bg-slate-800 border-slate-600 text-red-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <Waves className="w-3 h-3 text-red-400" /> Surge Zones
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showRainfall}
                onChange={(e) => setShowRainfall(e.target.checked)}
                className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-3 h-3 text-cyan-400" /> Rainfall Flood Risk
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showAssets}
                onChange={(e) => setShowAssets(e.target.checked)}
                className="rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <Building className="w-3 h-3 text-emerald-400" /> Critical Assets
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showRoads}
                onChange={(e) => setShowRoads(e.target.checked)}
                className="rounded bg-slate-800 border-slate-600 text-amber-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400 inline-block"></span> Key Road Links
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showTrack}
                onChange={(e) => setShowTrack(e.target.checked)}
                className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-cyan-400" /> Cyclone Track & Cone
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showScenarios}
                onChange={(e) => setShowScenarios(e.target.checked)}
                className="rounded bg-slate-800 border-slate-600 text-purple-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-dashed border-purple-400 inline-block"></span> Alternate Tracks
              </span>
            </label>
          </div>
        </div>

        {/* Inundation Legend */}
        {showLegend && (
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-xl text-xs text-slate-200 w-52">
            <div className="font-mono font-bold text-[11px] text-slate-400 mb-1.5 uppercase">
              Surge Inundation Depth
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400"></span>
                <span>&lt; 0.5m (Minor)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500/80 border border-amber-400"></span>
                <span>0.5m - 1.5m (Moderate)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-orange-500/80 border border-orange-400"></span>
                <span>1.5m - 3.0m (Severe)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-rose-600/90 border border-rose-500"></span>
                <span>&gt; 3.0m (Catastrophic)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Landfall & Location Bar at bottom */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2 z-20 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300 gap-2">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">TARGET LANDFALL:</span>
          <span className="text-red-400 font-bold">
            {landfallPos.lat.toFixed(2)}°N, {landfallPos.lng.toFixed(2)}°E (Puri Coast)
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">
            Tip: Drag 🎯 on map to change what-if landfall
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Bathymetry: Northern Bay Shelf</span>
          <span>Datum: MSL</span>
        </div>
      </div>
    </div>
  );
};
