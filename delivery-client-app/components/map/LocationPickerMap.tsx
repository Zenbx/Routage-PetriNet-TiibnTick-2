"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Loader2, Check, X } from "lucide-react";

// Fix Leaflet default icon issue
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
}

interface LocationPickerMapProps {
    initialLocation?: { latitude: number; longitude: number };
    onLocationSelect: (location: { latitude: number; longitude: number; address: string; city: string }) => void;
    onCancel?: () => void;
    hubs?: any[];
}

export function LocationPickerMap({ initialLocation, onLocationSelect, onCancel, hubs = [] }: LocationPickerMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState("");
    const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: initialLocation ? [initialLocation.latitude, initialLocation.longitude] : [3.8480, 11.5021],
            zoom: initialLocation ? 16 : 13,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        mapRef.current = map;

        // Handle map click
        map.on("click", async (e) => {
            const { lat, lng } = e.latlng;
            updateMarker(lat, lng);
            await reverseGeocode(lat, lng);
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(mapContainerRef.current);

        // Render hubs as markers
        if (hubs && hubs.length > 0) {
            const hubIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #f97316; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });

            hubs.forEach(hub => {
                if (hub.latitude && hub.longitude) {
                    L.marker([hub.latitude, hub.longitude], { icon: hubIcon })
                        .addTo(map)
                        .bindPopup(`<b style="color: #f97316;">${hub.name}</b><br/><span style="font-size: 10px;">Point Relais Disponibilité</span>`);
                }
            });
        }

        return () => {
            resizeObserver.disconnect();
            map.remove();
            mapRef.current = null;
        };
    }, []);

    const updateMarker = (lat: number, lng: number) => {
        if (!mapRef.current) return;

        setTempCoords({ lat, lng });

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        }

        mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                setSelectedAddress(data.display_name);
            }
        } catch (err) {
            console.error("Geocoding error:", err);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=cm`);
            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        updateMarker(lat, lng);
        setSelectedAddress(result.display_name);
        setSearchResults([]);
        setSearchQuery("");
    };

    const confirmSelection = () => {
        if (tempCoords) {
            // Extract city from address if possible
            const parts = selectedAddress.split(",");
            const city = parts[parts.length - 3]?.trim() || "";

            onLocationSelect({
                latitude: tempCoords.lat,
                longitude: tempCoords.lng,
                address: selectedAddress,
                city: city
            });
        }
    };

    return (
        <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
            {/* Search Header */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2">
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {isSearching ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Search className="w-5 h-5 text-text-muted" />}
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Rechercher un lieu (ex: Akwa, Bastos...)"
                        className="w-full bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-all shadow-xl"
                    />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                        {searchResults.map((result: any, idx) => (
                            <button
                                key={idx}
                                onClick={() => selectSearchResult(result)}
                                className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                            >
                                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-white/90">{result.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div ref={mapContainerRef} className="flex-1" />

            {/* Selection Footer Overlay */}
            {selectedAddress && (
                <div className="absolute bottom-6 left-4 right-4 z-[1000] animate-in slide-in-from-bottom-6 duration-500">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">LIEU SÉLECTIONNÉ</p>
                                <p className="text-white text-sm font-medium line-clamp-2 leading-relaxed">{selectedAddress}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmSelection}
                                className="flex-[2] py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-light transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                Confirmer ce lieu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!selectedAddress && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white/80 text-xs font-medium animate-bounce shadow-xl">
                    Cliquez sur la carte pour choisir précisément
                </div>
            )}
        </div>
    );
}
