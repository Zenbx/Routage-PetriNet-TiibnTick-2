"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers not showing
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Types
export interface MapLocation {
  lat: number;
  lng: number;
  label?: string;
  popup?: string;
  type?: "origin" | "destination" | "driver" | "waypoint";
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapLocation[];
  route?: [number, number][];
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

// Custom icons for different marker types
const createCustomIcon = (type: MapLocation["type"], color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const markerIcons = {
  origin: createCustomIcon("origin", "#10b981"), // green
  destination: createCustomIcon("destination", "#ff6b35"), // orange
  driver: createCustomIcon("driver", "#3b82f6"), // blue
  waypoint: createCustomIcon("waypoint", "#8b5cf6"), // purple
};

// Component to fit bounds when markers change
function FitBounds({ markers }: { markers: MapLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
}

export function Map({
  center = [3.848, 11.502], // Yaoundé par défaut
  zoom = 13,
  markers = [],
  route = [],
  className = "h-96 rounded-xl",
  onMapClick,
}: MapProps) {
  const [isClient, setIsClient] = useState(false);

  // Only render map on client side to avoid SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`${className} bg-background-light flex items-center justify-center`}>
        <p className="text-text-muted">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Markers */}
      {markers.map((marker, index) => (
        <Marker
          key={index}
          position={[marker.lat, marker.lng]}
          icon={marker.type ? markerIcons[marker.type] : DefaultIcon}
        >
          {(marker.popup || marker.label) && (
            <Popup>
              <div className="text-sm">
                <strong>{marker.label}</strong>
                {marker.popup && <p className="mt-1">{marker.popup}</p>}
              </div>
            </Popup>
          )}
        </Marker>
      ))}

      {/* Route polyline */}
      {route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{
            color: "#ff6b35",
            weight: 4,
            opacity: 0.8,
          }}
        />
      )}

      {/* Fit bounds to show all markers */}
      {markers.length > 0 && <FitBounds markers={markers} />}
    </MapContainer>
  );
}

// Export helper functions
export function getCenterFromMarkers(markers: MapLocation[]): [number, number] {
  if (markers.length === 0) return [3.848, 11.502];

  const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
  const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;

  return [avgLat, avgLng];
}

export function calculateBounds(markers: MapLocation[]) {
  if (markers.length === 0) return null;

  const lats = markers.map((m) => m.lat);
  const lngs = markers.map((m) => m.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}
