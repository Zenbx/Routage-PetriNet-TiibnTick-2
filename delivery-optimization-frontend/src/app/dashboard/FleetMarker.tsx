"use client";
import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchApi } from '@/lib/api/client';

const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then(mod => mod.Tooltip), { ssr: false });

export default function FleetMarker({ unit, nodes, deliveries, weights }: any) {
    const [pathNodes, setPathNodes] = useState<any[]>([]);
    const [pos, setPos] = useState<[number, number] | null>(null);
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('leaflet').then(leaflet => setL(leaflet));
        }
    }, []);

    const delivery = useMemo(() => deliveries.find((d: any) => d.id === unit.deliveryId), [deliveries, unit.deliveryId]);

    useEffect(() => {
        async function loadPath() {
            if (!delivery) return; // Allow reload on weights change
            try {
                const resp = await fetchApi('/api/v1/routing/shortest-path', {
                    method: 'POST',
                    body: JSON.stringify({
                        origin: delivery.pickupNodeId,
                        destination: delivery.dropoffNodeId,
                        costWeights: weights || { alpha: 0.2, beta: 0.5, gamma: 0.1, delta: 0.1, eta: 0.1 }
                    })
                });
                const coords = resp.path.map((id: string) => {
                    const n = nodes.find((node: any) => node.id === id);
                    return n ? [n.latitude, n.longitude] : null;
                }).filter(Boolean);
                setPathNodes(coords);
            } catch (e) {
                console.error("Failed to update fleet path", e);
            }
        }
        loadPath();
    }, [delivery?.id, nodes, weights]);

    useEffect(() => {
        if (pathNodes.length > 1) {
            const currentProg = unit.data?.kalmanState?.distanceCovered ?? 0;

            // Map 0 -> 1 progress to node index
            const exactIndex = currentProg * (pathNodes.length - 1);
            const index = Math.floor(exactIndex);
            const nextIndex = Math.min(index + 1, pathNodes.length - 1);
            const segmentProg = exactIndex - index;

            const start = pathNodes[index];
            const end = pathNodes[nextIndex];

            if (start && end) {
                const lat = start[0] + (end[0] - start[0]) * segmentProg;
                const lng = start[1] + (end[1] - start[1]) * segmentProg;
                setPos([lat, lng]);
            }
        }
    }, [unit.data?.kalmanState?.distanceCovered, pathNodes]);

    const icon = useMemo(() => {
        if (!L) return null;
        return L.divIcon({
            className: 'custom-fleet-icon',
            html: `<div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white scale-75 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v12Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                   </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }, [L]);

    if (!pos || !icon) return null;

    return (
        <Marker position={pos} icon={icon}>
            <Tooltip permanent direction="top" offset={[0, -10]} className="tactical-fleet-tooltip">
                <div className="text-[8px] font-black uppercase text-slate-900 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded shadow-sm border border-slate-200">
                    {unit.deliveryId} - {Math.round(unit.data?.kalmanState?.estimatedSpeed || 0)} km/h
                </div>
            </Tooltip>
        </Marker>
    );
}
