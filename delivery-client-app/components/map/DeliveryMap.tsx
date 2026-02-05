"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Package, Truck } from "lucide-react";

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface DeliveryMapProps {
  pickupLocation?: Location;
  deliveryLocation?: Location;
  driverLocation?: Location;
  hubs?: Array<Location & { id?: string, name?: string, type?: string }>;
  routePoints?: Array<[number, number]>;
  className?: string;
}

export function DeliveryMap({
  pickupLocation,
  deliveryLocation,
  driverLocation,
  hubs = [],
  routePoints = [],
  className = "",
}: DeliveryMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map only once
    const map = L.map(mapContainerRef.current, {
      center: [3.8480, 11.5021],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Force tile refresh after a short delay
    const tileTimeout = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);

    // Watch for container resizes (Full-screen toggle, etc)
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current && mapContainerRef.current) {
        mapRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(tileTimeout);
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Effect to update content (markers, route, hubs)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing transient layers (markers and polylines)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds: L.LatLngExpression[] = [];

    // Add Hub markers (Relay Points)
    hubs.filter(hub => hub.latitude && hub.longitude).forEach((hub) => {
      const hubIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full shadow-md border-2 border-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        `,
        className: "custom-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([hub.latitude, hub.longitude], { icon: hubIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 text-black">
            <div class="font-bold text-xs">🏪 ${hub.type === 'DEPOT' ? 'Dépôt' : 'Point Relais'}</div>
            <div class="text-[10px] text-gray-600">${hub.name || hub.id || 'Hub'}</div>
          </div>
        `);
    });

    // Add pickup marker
    if (pickupLocation && pickupLocation.latitude && pickupLocation.longitude) {
      const pickupIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        className: "custom-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      L.marker([pickupLocation.latitude, pickupLocation.longitude], { icon: pickupIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-black">
            <div class="font-bold text-sm mb-1">📦 Point de récupération</div>
            <div class="text-xs text-gray-600">${pickupLocation.address || "Adresse non disponible"}</div>
          </div>
        `);

      bounds.push([pickupLocation.latitude, pickupLocation.longitude]);
    }

    // Add delivery marker
    if (deliveryLocation && deliveryLocation.latitude && deliveryLocation.longitude) {
      const deliveryIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-10 h-10 bg-green-500 rounded-full shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        className: "custom-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      L.marker([deliveryLocation.latitude, deliveryLocation.longitude], { icon: deliveryIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-black">
            <div class="font-bold text-sm mb-1">🏠 Point de livraison</div>
            <div class="text-xs text-gray-600">${deliveryLocation.address || "Adresse non disponible"}</div>
          </div>
        `);

      bounds.push([deliveryLocation.latitude, deliveryLocation.longitude]);
    }

    // Add driver marker
    if (driverLocation && driverLocation.latitude && driverLocation.longitude) {
      const driverIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-10 h-10 bg-purple-500 rounded-full shadow-lg border-2 border-white animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
        `,
        className: "custom-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      L.marker([driverLocation.latitude, driverLocation.longitude], { icon: driverIcon, zIndexOffset: 2000 })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-black">
            <div class="font-bold text-sm mb-1">🚚 Livreur</div>
            <div class="text-xs text-gray-600">Position actuelle</div>
          </div>
        `);

      bounds.push([driverLocation.latitude, driverLocation.longitude]);
    }

    // Draw route line
    if (routePoints && routePoints.length > 0 && routePoints.every(p => p && p.length === 2 && p[0] != null && p[1] != null)) {
      // Itinéraire réel calculé
      L.polyline(routePoints, {
        color: "#f97316",
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
        className: 'route-line-dynamic'
      }).addTo(map);

      routePoints.forEach(p => bounds.push(p));
    } else if (pickupLocation?.latitude != null && pickupLocation?.longitude != null &&
      deliveryLocation?.latitude != null && deliveryLocation?.longitude != null) {
      // Ligne directe (fallback)
      L.polyline([
        [pickupLocation.latitude, pickupLocation.longitude],
        [deliveryLocation.latitude, deliveryLocation.longitude]
      ], {
        color: "#f97316",
        weight: 4,
        opacity: 0.5,
        dashArray: "10, 10",
      }).addTo(map);
    }

    // Fit map to bounds
    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds as L.LatLngTuple[]);
      map.fitBounds(latLngBounds, { padding: [50, 50] });
    }
  }, [pickupLocation, deliveryLocation, driverLocation, hubs, routePoints]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full rounded-xl overflow-hidden ${className}`}
    />
  );
}
