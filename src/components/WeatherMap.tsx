import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Weather tile source using OpenPortGuide demo tiles (no API key required)
// URL schema: https://weather.openportguide.de/tiles/actual/{variable}/{timestep}/{z}/{x}/{y}.png
// Variables examples: air_temperature | wind_stream | precipitation_shaded
// Timesteps: 0h, 6h, 12h, ... up to 72h

const VARIABLES = [
  { key: "air_temperature", label: "Temperature" },
  { key: "wind_stream", label: "Wind Stream" },
  { key: "precipitation_shaded", label: "Precipitation" },
] as const;

type VariableKey = typeof VARIABLES[number]["key"];

const TIMESTEPS = [0, 6, 12, 24, 36, 48, 60, 72] as const;

const WEATHER_SOURCE_ID = "weather-tiles";
const WEATHER_LAYER_ID = "weather-tiles-layer";

const buildWeatherTiles = (variable: VariableKey, timestep: number) =>
  `https://weather.openportguide.de/tiles/actual/${variable}/${timestep}h/{z}/{x}/{y}.png`;

const WeatherMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [mapboxToken, setMapboxToken] = useState<string | null>(
    () => localStorage.getItem("MAPBOX_TOKEN")
  );
  const [variable, setVariable] = useState<VariableKey>("air_temperature");
  const [timestep, setTimestep] = useState<number>(6);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      projection: "globe",
      zoom: 2.2,
      center: [10, 20],
      pitch: 45,
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    // Add subtle fog for globe feel
    map.on("style.load", () => {
      try {
        map.setFog({
          color: "rgba(255,255,255,1)",
          "high-color": "rgba(200,200,230,1)",
          "horizon-blend": 0.2,
        } as any);
      } catch {}
      addOrUpdateWeatherLayer();
    });

    // Disable scroll zoom for smoothness
    map.scrollZoom.disable();

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Update layer when inputs change
  useEffect(() => {
    if (!mapRef.current) return;
    addOrUpdateWeatherLayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable, timestep]);

  const addOrUpdateWeatherLayer = () => {
    const map = mapRef.current;
    if (!map) return;

    const tiles = [buildWeatherTiles(variable, timestep)];

    // If layer exists, remove it first for a clean update
    if (map.getLayer(WEATHER_LAYER_ID)) {
      map.removeLayer(WEATHER_LAYER_ID);
    }
    if (map.getSource(WEATHER_SOURCE_ID)) {
      map.removeSource(WEATHER_SOURCE_ID);
    }

    map.addSource(WEATHER_SOURCE_ID, {
      type: "raster",
      tiles,
      tileSize: 256,
      attribution:
        'Weather tiles © OpenPortGuide (demo) | Base map © Mapbox & OpenStreetMap',
    });

    map.addLayer({
      id: WEATHER_LAYER_ID,
      type: "raster",
      source: WEATHER_SOURCE_ID,
      paint: {
        "raster-opacity": 0.85,
      },
    });
  };

  const saveToken = () => {
    if (!mapboxToken) return;
    localStorage.setItem("MAPBOX_TOKEN", mapboxToken);
    window.location.reload();
  };

  return (
    <section aria-label="Global Weather Forecast Map" className="relative w-full h-[85vh] rounded-lg overflow-hidden border bg-card">
      {!mapboxToken ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="w-full max-w-xl space-y-4 rounded-lg border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6 shadow-lg">
            <h2 className="text-2xl font-semibold">Enter Mapbox public token</h2>
            <p className="text-sm text-muted-foreground">
              Add your Mapbox public access token to render the interactive globe. You can find it in your Mapbox account under Tokens. The token is stored locally in your browser.
            </p>
            <Input
              placeholder="pk.eyJ1Ijo..."
              value={mapboxToken ?? ""}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setMapboxToken("")}>Clear</Button>
              <Button onClick={saveToken}>Save token</Button>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={mapContainer} className="absolute inset-0" />

      {/* Controls */}
      <div className="pointer-events-auto absolute left-4 top-4 w-full max-w-md">
        <div className="rounded-xl border bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur p-4 shadow-[var(--shadow-elegant,_0_10px_30px_-10px_rgba(0,0,0,0.2))]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="col-span-1 sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Variable</label>
              <Select value={variable} onValueChange={(v) => setVariable(v as VariableKey)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select variable" />
                </SelectTrigger>
                <SelectContent>
                  {VARIABLES.map((v) => (
                    <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Model</label>
              <div className="text-sm font-medium">GFS</div>
              <div className="text-[10px] text-muted-foreground">via OpenPortGuide demo</div>
            </div>

            <div className="col-span-1 sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Lead time</label>
              <div className="text-sm font-medium">{timestep}h</div>
              <div className="text-[10px] text-muted-foreground">0–72h</div>
            </div>
          </div>

          <div className="mt-3">
            <Slider
              value={[timestep]}
              min={0}
              max={72}
              step={6}
              onValueChange={([v]) => setTimestep(v)}
            />
          </div>
        </div>
      </div>

      {/* Ambient gradient accent */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(120px circle at 20% 20%, hsl(var(--primary)/0.15), transparent 60%)" }} />
    </section>
  );
};

export default WeatherMap;
