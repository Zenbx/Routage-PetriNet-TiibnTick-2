"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { graphApi } from "@/lib/api/graph";
import { fetchApi } from "@/lib/api/client";
import { Node, Arc } from "@/types/graph";
import {
    Activity,
    Navigation,
    Layers,
    CloudRain,
    Database,
    MapPin,
    Search,
    Info,
    Zap,
    Wind,
    ArrowRight
} from "lucide-react";
import CostSimulator, { CostWeights } from "@/components/network/CostSimulator";
import CostBreakdownChart from "@/components/charts/CostBreakdownChart";
import { routingApi } from "@/lib/api/routing";

// Dynamically load map as background
const NetworkGraph = dynamic(() => import("@/components/maps/NetworkGraph"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement du Maillage...</div>
});

export default function NetworkCommandCenter() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [arcs, setArcs] = useState<Arc[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [simulating, setSimulating] = useState(false);

    // Pathfinding & Weights State
    const [weights, setWeights] = useState<CostWeights>({
        alpha: 0.2,
        beta: 0.5,
        gamma: 0.1,
        delta: 0.1,
        eta: 0.1
    });
    const [originNode, setOriginNode] = useState<Node | null>(null);
    const [destNode, setDestNode] = useState<Node | null>(null);
    const [calculatedPath, setCalculatedPath] = useState<string[]>([]);
    const [pathResult, setPathResult] = useState<any>(null);
    const [calculating, setCalculating] = useState(false);

    async function loadData() {
        try {
            const [nodesData, arcsData] = await Promise.all([
                graphApi.getNodes(),
                graphApi.getArcs()
            ]);
            setNodes(nodesData);
            setArcs(arcsData);
        } catch (error) {
            console.error("Failed to load graph data", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const handleRecalculate = async () => {
        if (!originNode || !destNode) {
            alert("Veuillez sélectionner un départ et une destination (Cliquez sur les points)");
            return;
        }

        setCalculating(true);
        try {
            const resp = await routingApi.calculateShortestPath({
                origin: originNode.id,
                destination: destNode.id,
                costWeights: weights
            });
            setCalculatedPath(resp.path);
            setPathResult(resp);
        } catch (error) {
            console.error("Path calculation failed", error);
        } finally {
            setCalculating(false);
        }
    };

    const handleNodeClick = (node: Node) => {
        setSelectedNode(node);
        // Logic to set origin/dest sequentially
        if (!originNode || (originNode && destNode)) {
            setOriginNode(node);
            setDestNode(null);
            setCalculatedPath([]);
            setPathResult(null);
        } else if (originNode && !destNode && originNode.id !== node.id) {
            setDestNode(node);
        }
    };

    const handleSimulation = async (type: 'traffic' | 'weather') => {
        setSimulating(true);
        try {
            if (type === 'traffic') {
                await fetchApi('/api/v1/simulation/traffic', { method: 'POST' });
            } else {
                await fetchApi('/api/v1/simulation/weather', {
                    method: 'POST',
                    body: JSON.stringify({ rain: true })
                });
            }
            await loadData();
        } catch (error) {
            console.error("Simulation failed", error);
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className="relative w-full h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 overflow-hidden">
            {/* BACKGROUND NETWORK MAP - FULL SCREEN */}
            <div className="absolute inset-0 z-0">
                <NetworkGraph
                    nodes={nodes}
                    arcs={arcs}
                    onNodeSelect={handleNodeClick}
                    highlightPath={calculatedPath}
                />
            </div>

            {/* TOP HEADER: SYSTEM TELEMETRY - GLASSMORPHIC */}
            <div className="absolute top-6 left-6 right-6 flex justify-between z-10 pointer-events-none">
                <div className="backdrop-blur-xl bg-white/50 border border-white/60 rounded-2xl shadow-2xl shadow-black/5 px-6 py-3 flex items-center space-x-6">
                    <div className="flex items-center space-x-3 pr-6 border-r border-slate-300/30">
                        <Database className="w-4 h-4 text-slate-600" />
                        <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight">{nodes.length} Nœuds</span>
                    </div>
                    <div className="flex items-center space-x-3 pr-6 border-r border-slate-300/30">
                        <Layers className="w-4 h-4 text-slate-600" />
                        <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight">{arcs.length} Arcs</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                        <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-tight">Réseau Synchronisé</span>
                    </div>
                </div>

                <div className="flex space-x-3 pointer-events-auto">
                    <div className="backdrop-blur-xl bg-white/50 border border-white/60 rounded-2xl shadow-2xl shadow-black/5 flex items-center px-5 py-3 space-x-3">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="RECHERCHE..."
                            className="bg-transparent border-none text-[11px] focus:ring-0 w-48 font-bold text-slate-800 placeholder:text-slate-400 tracking-wide outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* LEFT: NODE INTELLIGENCE - GLASSMORPHIC */}
            <div className="absolute top-28 left-6 bottom-6 w-80 z-10 flex flex-col pointer-events-none">
                <div className="backdrop-blur-2xl bg-white/40 border border-white/60 rounded-3xl shadow-2xl shadow-black/10 flex-1 flex flex-col pointer-events-auto overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200/40 bg-gradient-to-r from-blue-50/40 to-transparent">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center backdrop-blur-sm">
                                <Info className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-800">Intelligence Nœud</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {selectedNode ? (
                            <div className="space-y-6">
                                {/* Node ID Banner */}
                                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-lg">
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">NODE_ID</p>
                                    <p className="text-base font-black tracking-tight">{selectedNode.name}</p>
                                </div>

                                {/* Classification Badge */}
                                <div className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</p>
                                    <span className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-lg ${selectedNode.type === 'DEPOT' ? 'bg-orange-100 text-orange-700' :
                                        selectedNode.type === 'RELAY' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {selectedNode.type}
                                    </span>
                                </div>

                                {/* Coordinates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Latitude</p>
                                        <p className="text-xs font-mono font-black text-slate-900">{selectedNode.latitude?.toFixed(5)}</p>
                                    </div>
                                    <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Longitude</p>
                                        <p className="text-xs font-mono font-black text-slate-900">{selectedNode.longitude?.toFixed(5)}</p>
                                    </div>
                                </div>

                                {/* Arc Diagnostics */}
                                <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Arcs Connectés</p>
                                    <div className="space-y-2">
                                        {arcs.filter(a => a.originId === selectedNode.id || a.destinationId === selectedNode.id).slice(0, 3).map((arc, i) => (
                                            <div key={i} className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-lg">
                                                <span className="text-[10px] font-bold text-slate-700">{arc.originId} → {arc.destinationId}</span>
                                                <span className="text-[9px] font-black text-emerald-600">✓ OK</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setOriginNode(selectedNode)}
                                        className={`w-full p-4 rounded-xl text-[11px] font-black uppercase tracking-wide flex items-center justify-between transition-all shadow-lg ${originNode?.id === selectedNode.id
                                            ? 'bg-blue-600 text-white shadow-blue-500/30'
                                            : 'bg-white/80 backdrop-blur-sm text-slate-700 border border-white/90 hover:bg-blue-50'
                                            }`}
                                    >
                                        <span>Départ</span>
                                        <MapPin className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDestNode(selectedNode)}
                                        className={`w-full p-4 rounded-xl text-[11px] font-black uppercase tracking-wide flex items-center justify-between transition-all shadow-lg ${destNode?.id === selectedNode.id
                                            ? 'bg-red-600 text-white shadow-red-500/30'
                                            : 'bg-white/80 backdrop-blur-sm text-slate-700 border border-white/90 hover:bg-red-50'
                                            }`}
                                    >
                                        <span>Arrivée</span>
                                        <Navigation className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100/60 backdrop-blur-sm flex items-center justify-center mb-5">
                                    <Navigation className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide leading-relaxed">
                                    Sélectionnez un nœud sur la carte
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: SCENARIO CONTROLLER - GLASSMORPHIC */}
            <div className="absolute top-28 right-6 w-72 z-10 pointer-events-none flex flex-col space-y-4">
                {/* Scenario Controls */}
                <div className="backdrop-blur-2xl bg-white/40 border border-white/60 rounded-3xl shadow-2xl shadow-black/10 p-6 pointer-events-auto">
                    <div className="flex items-center space-x-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center backdrop-blur-sm">
                            <Zap className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Scénarios</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            onClick={() => handleSimulation('traffic')}
                            disabled={simulating}
                            className="bg-white/70 backdrop-blur-sm hover:bg-white/90 p-4 rounded-2xl border border-white/80 flex flex-col items-center justify-center group transition-all shadow-lg"
                        >
                            <Activity className="w-5 h-5 text-slate-500 group-hover:text-blue-600 mb-2" />
                            <span className="text-[10px] font-black text-slate-700 uppercase">Trafic</span>
                        </button>

                        <button
                            onClick={() => handleSimulation('weather')}
                            disabled={simulating}
                            className="bg-white/70 backdrop-blur-sm hover:bg-white/90 p-4 rounded-2xl border border-white/80 flex flex-col items-center justify-center group transition-all shadow-lg"
                        >
                            <CloudRain className="w-5 h-5 text-slate-500 group-hover:text-blue-600 mb-2" />
                            <span className="text-[10px] font-black text-slate-700 uppercase">Météo</span>
                        </button>
                    </div>

                    <button
                        onClick={async () => {
                            setSimulating(true);
                            try {
                                await fetchApi('/api/v1/simulation/reroute', { method: 'POST' });
                                await loadData();
                            } catch (e) { console.error(e); }
                            finally { setSimulating(false); }
                        }}
                        disabled={simulating}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-2xl shadow-blue-500/30 text-white"
                    >
                        <Zap className="w-4 h-4" />
                        <span className="text-[11px] font-black uppercase tracking-wide">Reroute Global</span>
                    </button>
                </div>

                {/* COST SIMULATOR */}
                <CostSimulator
                    weights={weights}
                    onChange={setWeights}
                    onRecalculate={handleRecalculate}
                    loading={calculating}
                />

                {/* PATH INFO UNIT - GLASSMORPHIC DARK */}
                {(originNode || destNode) && (
                    <div className="backdrop-blur-2xl bg-slate-900/90 border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6 pointer-events-auto">
                        <div className="flex items-center space-x-3 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <ArrowRight className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wide">Mission</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl backdrop-blur-sm">
                                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-[10px] font-black text-white">A</div>
                                <span className="text-[11px] font-bold text-slate-300 truncate flex-1">{originNode?.name || 'Non défini'}</span>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl backdrop-blur-sm">
                                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-[10px] font-black text-white">B</div>
                                <span className="text-[11px] font-bold text-slate-300 truncate flex-1">{destNode?.name || 'Non défini'}</span>
                            </div>

                            {pathResult && (
                                <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Distance</span>
                                        <span className="font-black text-blue-400 text-sm">{pathResult.distance.toFixed(1)} km</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Coût</span>
                                        <span className="font-black text-amber-400 text-sm">{pathResult.totalCost.toFixed(2)} UC</span>
                                    </div>

                                    <div className="mt-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Répartition</p>
                                        <CostBreakdownChart data={[
                                            { name: 'Dist', value: pathResult.costBreakdown?.Distance || 0, color: '#3b82f6' },
                                            { name: 'Time', value: pathResult.costBreakdown?.Time || 0, color: '#10b981' },
                                            { name: 'Pen', value: pathResult.costBreakdown?.Penibility || 0, color: '#f59e0b' },
                                            { name: 'Wet', value: pathResult.costBreakdown?.Weather || 0, color: '#ef4444' },
                                            { name: 'Fuel', value: pathResult.costBreakdown?.Fuel || 0, color: '#6366f1' },
                                        ]} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MAP ZOOM CONTROLS OVERRIDE */}
            <style jsx global>{`
                .leaflet-top.leaflet-left, .leaflet-control-zoom {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}

