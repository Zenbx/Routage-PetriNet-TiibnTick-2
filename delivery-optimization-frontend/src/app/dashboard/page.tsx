"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { graphApi } from "@/lib/api/graph";
import { fetchApi } from "@/lib/api/client";
import {
    Activity,
    Truck,
    Zap,
    Navigation,
    Search,
    MapPin,
    AlertCircle,
    Play,
    Pause,
    RotateCcw,
    Settings,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import CostSimulator from "@/components/network/CostSimulator";

// Dynamically load map as background
const NetworkGraph = dynamic(() => import("@/components/maps/NetworkGraph"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">Initialisation du Graphe...</div>
});
import FleetMarker from "./FleetMarker";

export default function CommandCenter() {
    const [stats, setStats] = useState<any>(null);
    const [nodes, setNodes] = useState<any[]>([]);
    const [arcs, setArcs] = useState<any[]>([]);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [fleetState, setFleetState] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [simStatus, setSimStatus] = useState<'IDLE' | 'RUNNING' | 'PAUSED'>('IDLE');
    const [showExpert, setShowExpert] = useState(false);
    const [weights, setWeights] = useState({ alpha: 0.2, beta: 0.5, gamma: 0.1, delta: 0.1, eta: 0.1 });

    const fleetStateRef = useRef<Record<string, any>>({});
    const { data: fleetUpdate } = useWebSocket<any>('/topic/fleet');

    useEffect(() => {
        async function loadData() {
            try {
                const [s, n, a, del] = await Promise.all([
                    fetchApi('/api/v1/delivery/stats'),
                    graphApi.getNodes(),
                    graphApi.getArcs(),
                    fetchApi('/api/v1/delivery')
                ]);
                setStats(s);
                setNodes(n);
                setArcs(a);
                const active = del.filter((d: any) => d.status !== 'DELIVERED');
                setDeliveries(active);

                const initialFleet: Record<string, any> = {};
                active.forEach((d: any) => {
                    initialFleet[d.id] = {
                        deliveryId: d.id,
                        data: { kalmanState: { distanceCovered: 0, estimatedSpeed: 30 } }
                    };
                });
                setFleetState(initialFleet);
                fleetStateRef.current = initialFleet;
            } catch (error) {
                console.error("Dashboard init error", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // WebSocket Update Handler
    useEffect(() => {
        if (fleetUpdate && fleetUpdate.deliveryId) {
            setFleetState(prev => {
                const newState = { ...prev, [fleetUpdate.deliveryId]: fleetUpdate };
                fleetStateRef.current = newState;
                return newState;
            });
        }
    }, [fleetUpdate]);

    // Interval Engine for Autonomous Fleet (STABLE & FLUID)
    useEffect(() => {
        let timer: any;
        if (simStatus === 'RUNNING') {
            timer = setInterval(async () => {
                try {
                    const currentFleet = fleetStateRef.current;
                    const updates = deliveries
                        .filter(del => (currentFleet[del.id]?.data?.kalmanState?.distanceCovered || 0) < 1.0)
                        .map(del => {
                            const currentProg = currentFleet[del.id]?.data?.kalmanState?.distanceCovered || 0;
                            const nextProg = Math.min(currentProg + 0.01, 1.0); // 1% every 1s

                            return fetchApi(`/api/v1/tracking/${del.id}/update`, {
                                method: 'POST',
                                body: JSON.stringify({
                                    currentSpeed: 30 + Math.random() * 20,
                                    distanceCovered: nextProg,
                                    timestamp: new Date().toISOString()
                                })
                            }).catch(err => console.warn(`Update failed for ${del.id}`, err));
                        });

                    if (updates.length > 0) {
                        await Promise.all(updates);
                    }
                } catch (e) {
                    console.error("Simulation loop failed", e);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [simStatus, deliveries.length]); // Minimize dependencies

    const handleResetFleet = async () => {
        setSimStatus('IDLE');
        setLoading(true);
        try {
            await Promise.all(deliveries.map(del =>
                fetchApi(`/api/v1/tracking/${del.id}/update`, {
                    method: 'POST',
                    body: JSON.stringify({ currentSpeed: 0, distanceCovered: 0, timestamp: new Date().toISOString() })
                })
            ));
            const resetFleet: Record<string, any> = {};
            deliveries.forEach((d: any) => {
                resetFleet[d.id] = { deliveryId: d.id, data: { kalmanState: { distanceCovered: 0, estimatedSpeed: 0 } } };
            });
            setFleetState(resetFleet);
            fleetStateRef.current = resetFleet;
        } catch (e) {
            console.error("Reset failed", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full h-screen bg-slate-50 overflow-hidden">
            {/* BACKGROUND MAP */}
            <div className="absolute inset-0 z-0 scale-105">
                <NetworkGraph nodes={nodes} arcs={arcs}>
                    {Object.values(fleetState).map((unit: any) => (
                        <FleetMarker key={unit.deliveryId} unit={unit} nodes={nodes} deliveries={deliveries} weights={weights} />
                    ))}
                </NetworkGraph>
            </div>

            {/* TOP HEADER */}
            <div className="absolute top-6 left-24 right-6 flex justify-between z-10 pointer-events-none">
                <div className="tactical-module px-4 py-2 flex items-center space-x-6 border-slate-200/40">
                    <div className="flex items-center space-x-3 pr-6 border-r border-slate-100">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <span className="text-[11px] font-bold text-slate-700">{stats?.activeDeliveries || 0} Unités Actives</span>
                    </div>
                    {simStatus === 'RUNNING' && (
                        <div className="flex items-center space-x-3 pr-6 border-r border-slate-100">
                            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Simulation Live (1Hz)</span>
                        </div>
                    )}
                    <div className="flex items-center space-x-3 pr-6 border-r border-slate-100">
                        <span className="text-[11px] font-bold text-slate-700">{stats?.successRate || 0}% Précision</span>
                    </div>
                </div>

                <div className="flex space-x-2 pointer-events-auto">
                    <div className="tactical-module flex items-center px-4 space-x-2 bg-white/60">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="RECHERCHE TACTIQUE..."
                            className="bg-transparent border-none text-[10px] focus:ring-0 w-40 font-bold text-slate-700 placeholder:text-slate-300 tracking-wider"
                        />
                    </div>
                </div>
            </div>

            {/* LEFT SIDEBAR */}
            <div className="absolute top-28 left-24 bottom-10 w-80 z-10 flex flex-col pointer-events-none">
                <div className="tactical-module flex-1 flex flex-col pointer-events-auto overflow-hidden">
                    <div className="p-4 bg-slate-50/80 backdrop-blur border-b border-slate-100 space-y-4">
                        <div className="flex space-x-2">
                            {simStatus !== 'RUNNING' ? (
                                <button
                                    onClick={() => setSimStatus('RUNNING')}
                                    className="flex-1 btn-command flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg"
                                >
                                    <Play className="w-4 h-4" />
                                    <span className="font-black text-[10px] uppercase tracking-widest">Démarrer</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setSimStatus('PAUSED')}
                                    className="flex-1 btn-command flex items-center justify-center space-x-2 py-3 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-lg"
                                >
                                    <Pause className="w-4 h-4" />
                                    <span className="font-black text-[10px] uppercase tracking-widest">Pause</span>
                                </button>
                            )}
                            <button
                                onClick={handleResetFleet}
                                className="px-4 btn-command flex items-center justify-center bg-white text-slate-400 border-slate-200"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white/50">
                            <button
                                onClick={() => setShowExpert(!showExpert)}
                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-white"
                            >
                                <div className="flex items-center space-x-2">
                                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-[10px] font-black uppercase text-slate-600">Mode Expert (A*)</span>
                                </div>
                                {showExpert ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                            </button>

                            {showExpert && (
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <CostSimulator
                                        weights={weights}
                                        onChange={setWeights}
                                        onRecalculate={() => { }}
                                        compact={true}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => window.location.href = '/tours/plan'}
                            className="w-full p-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center space-x-2 shadow-xl hover:bg-slate-800"
                        >
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Accéder au Planning VRP</span>
                        </button>
                    </div>

                    <div className="flex-1 tactical-scroll p-4 space-y-3 overflow-y-auto">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-lg animate-pulse" />)}
                            </div>
                        ) : (deliveries.length === 0 ? (
                            <div className="text-center py-10">
                                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Aucune livraison active</p>
                            </div>
                        ) : (
                            deliveries.map((del) => {
                                const live = fleetState[del.id]?.data;
                                const prog = (live?.kalmanState?.distanceCovered ?? 0) * 100;
                                return (
                                    <div key={del.id} className="p-3 bg-slate-50/50 border border-slate-100/50 rounded-lg hover:border-blue-200 hover:bg-white transition-all group">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-[10px] font-black text-slate-900 font-mono">{del.id}</span>
                                                {prog > 0 && prog < 100 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                {prog >= 100 && <span className="text-[10px] text-emerald-600 font-bold">LIVRÉ</span>}
                                            </div>
                                            <button
                                                onClick={() => window.location.href = `/delivery/${del.id}`}
                                                className="text-[9px] text-blue-600 font-bold opacity-0 group-hover:opacity-100"
                                            >
                                                DÉTAILS
                                            </button>
                                        </div>
                                        <div className="flex items-center space-x-2 text-[11px] text-slate-600 mb-2">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            <span>{del.pickupNodeId} → {del.dropoffNodeId}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mb-2">
                                            <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${Math.min(100, prog)}%` }} />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px]">
                                            <span className="font-bold text-slate-400">
                                                {live?.kalmanState?.estimatedSpeed?.toFixed(1) || '0'} KM/H
                                            </span>
                                            <span className="font-mono text-slate-400">{(prog).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT TELEMETRY */}
            <div className="absolute top-28 right-8 w-72 z-10 pointer-events-none flex flex-col space-y-4">
                <div className="tactical-module p-4 pointer-events-auto bg-white/95 shadow-2xl">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-3 flex items-center">
                        <Activity className="w-3 h-3 mr-2 text-blue-500" />
                        Télémétrie Flotte
                    </p>
                    <div className="space-y-2 font-mono text-[9px]">
                        <div className="flex justify-between items-center text-emerald-600 bg-emerald-50/50 p-1.5 rounded">
                            <span>Moteur Simulation</span>
                            <span className="font-bold">{simStatus === 'RUNNING' ? 'SYSTEM_ACTIVE' : 'READY_STANDBY'}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 pb-1 border-b border-slate-50">
                            <span>Latence Flux (WS)</span>
                            <span className="text-slate-900">~12ms</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                            <span>Calculateur Kalman</span>
                            <span className="text-blue-500 font-bold uppercase">Online</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .leaflet-top.leaflet-left, .leaflet-control-zoom { display: none !important; }
                .leaflet-container { cursor: default !important; }
                .tactical-module {
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 1rem;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(8px);
                }
                .btn-command {
                    border-radius: 0.75rem;
                    font-weight: 900;
                    letter-spacing: 0.05em;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .btn-command:active {
                    transform: scale(0.95);
                }
                .tactical-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                .tactical-scroll::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
