"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Node, Arc } from "@/types/graph";

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then(mod => mod.Tooltip), { ssr: false });

interface NetworkGraphProps {
    nodes: Node[];
    arcs: Arc[];
    onNodeSelect?: (node: Node) => void;
    highlightPath?: string[];
    children?: React.ReactNode;
}

export default function NetworkGraph({ nodes, arcs, onNodeSelect, highlightPath, children }: NetworkGraphProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[600px] bg-slate-100 flex items-center justify-center rounded-xl">Chargement de la carte...</div>;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const getNodeColor = (type: string) => {
        switch (type) {
            case 'DEPOT': return '#f97316'; // Orange-500
            case 'RELAY': return '#10b981'; // Emerald-500
            default: return '#3b82f6'; // Blue-500
        }
    };

    const getArcColor = (arc: Arc, isHighlighted: boolean) => {
        if (isHighlighted) return "#3b82f6"; // Blue when highlighted
        if (arc.cost && arc.cost > 2.0) return "#ef4444"; // Red for high cost/traffic
        return "#cbd5e1"; // Slate-300 for normal
    };

    const getArcWeight = (arc: Arc, isHighlighted: boolean) => {
        if (isHighlighted) return 5;
        if (arc.cost && arc.cost > 2.0) return 4;
        return 2;
    };

    return (
        <div className="h-full w-full relative">
            <MapContainer
                center={[3.8480, 11.5100]}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />

                {/* Arcs */}
                {arcs.map((arc, idx) => {
                    const origin = nodeMap.get(arc.originId);
                    const dest = nodeMap.get(arc.destinationId);
                    if (!origin || !dest) return null;

                    const isHighlighted = highlightPath?.includes(arc.originId) && highlightPath?.includes(arc.destinationId);

                    return (
                        <Polyline
                            key={`arc-${idx}`}
                            positions={[
                                [origin.latitude, origin.longitude],
                                [dest.latitude, dest.longitude]
                            ]}
                            pathOptions={{
                                color: getArcColor(arc, !!isHighlighted),
                                weight: getArcWeight(arc, !!isHighlighted),
                                opacity: isHighlighted ? 1 : 0.6
                            }}
                        >
                            <Tooltip sticky className="tactical-tooltip-container">
                                <div className="p-3 bg-slate-900/95 text-white backdrop-blur-md rounded-lg shadow-2xl border border-white/10 min-w-[140px]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2 border-b border-white/5 pb-1">TELEMETRY_DATA</p>
                                    <div className="space-y-1.5 font-mono">
                                        <div className="flex justify-between items-center text-[9px] font-bold">
                                            <span className="text-white/40 uppercase">DISTANCE</span>
                                            <span>{arc.distance.toFixed(2)} KM</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-bold">
                                            <span className="text-white/40 uppercase">SCORE</span>
                                            <span className={(arc.cost || 0) > 2 ? 'text-red-400' : 'text-emerald-400'}>{(arc.cost || 0).toFixed(2)} UC</span>
                                        </div>
                                    </div>
                                </div>
                            </Tooltip>
                        </Polyline>
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => (
                    <CircleMarker
                        key={node.id}
                        center={[node.latitude, node.longitude]}
                        radius={node.type === 'RELAY' ? 8 : 6}
                        pathOptions={{
                            fillColor: getNodeColor(node.type),
                            fillOpacity: 1,
                            color: "white",
                            weight: 2,
                        }}
                        eventHandlers={{
                            click: () => onNodeSelect?.(node),
                        }}
                    >
                        <Tooltip sticky className="tactical-tooltip-container">
                            <div className="p-3 bg-slate-900/95 text-white backdrop-blur-md rounded-lg shadow-2xl border border-white/10 min-w-[140px]">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2 border-b border-white/5 pb-1">NODE_INFO</p>
                                <div className="space-y-1.5 font-mono">
                                    <div className="flex justify-between items-center text-[9px] font-bold">
                                        <span className="text-white/40 uppercase">ID</span>
                                        <span>{node.id}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold">
                                        <span className="text-white/40 uppercase">TYPE</span>
                                        <span className="text-blue-400">{node.type}</span>
                                    </div>
                                    {node.type === 'RELAY' && (
                                        <div className="flex justify-between items-center text-[9px] font-bold">
                                            <span className="text-white/40 uppercase">CAPACITY</span>
                                            <span className={(node.currentOccupancy || 0) >= (node.capacity || 0) ? 'text-red-400' : 'text-emerald-400'}>
                                                {node.currentOccupancy || 0} / {node.capacity || 0}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Tooltip>
                    </CircleMarker>
                ))}

                {children}
            </MapContainer>
        </div>
    );
}
