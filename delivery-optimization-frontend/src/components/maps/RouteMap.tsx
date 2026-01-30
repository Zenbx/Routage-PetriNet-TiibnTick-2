"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Truck, MapPin } from "lucide-react";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

interface RouteMapProps {
    plannedPath: [number, number][];
    currentPosition: [number, number];
    history: [number, number][];
}

export default function RouteMap({ plannedPath, currentPosition, history }: RouteMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[400px] bg-slate-100 rounded-xl animate-pulse"></div>;

    return (
        <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
            <MapContainer
                center={currentPosition}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* Planned Path */}
                <Polyline positions={plannedPath} color="#3b82f6" weight={4} dashArray="10, 10" opacity={0.5} />

                {/* Actual History */}
                <Polyline positions={history} color="#10b981" weight={6} />

                {/* Courier Marker */}
                <Marker position={currentPosition}>
                    {/* Custom truck icon would go here */}
                </Marker>

                {/* Start/End Markers */}
                {plannedPath.length > 0 && (
                    <>
                        <Marker position={plannedPath[0]} />
                        <Marker position={plannedPath[plannedPath.length - 1]} />
                    </>
                )}
            </MapContainer>
        </div>
    );
}
