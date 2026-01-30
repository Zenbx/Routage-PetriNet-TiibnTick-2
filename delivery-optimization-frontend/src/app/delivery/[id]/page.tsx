"use client";
import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Truck, Navigation, Activity, MapPin, AlertCircle, ShieldCheck, Timer, Zap } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { routingApi } from "@/lib/api/routing";
import { graphApi } from "@/lib/api/graph";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => mod.CircleMarker), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

// For useMap, we need a trick since mod is only available inside dynamic
// but actually hooks work fine if we just import them normally in a client component
import { useMap } from "react-leaflet";

const MapController = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        const zoom = map.getZoom();
        // Ne suivre que si on est assez zoomé (zoom >= 14)
        // Cela permet à l'utilisateur de dézoomer pour voir tout le réseau sans être "snappé" en arrière
        if (zoom < 14) return;

        const currentCenter = map.getCenter();
        const dist = Math.sqrt(Math.pow(center[0] - currentCenter.lat, 2) + Math.pow(center[1] - currentCenter.lng, 2));

        // Seconde mesure : Rayon de 0.0005 degrés (~50m) pour suivre les impulsions de 10% sans trembler
        if (dist > 0.0005) {
            map.setView(center, zoom, { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
};

export default function DeliveryTrackingPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { data: wsStats, connected: wsConnected } = useWebSocket<any>(`/topic/tracking/${params.id}`);
    const isDemoMode = searchParams?.get('demo') === 'true';

    // Core State
    const [delivery, setDelivery] = useState<any>(null);
    const [pathNodes, setPathNodes] = useState<any[]>([]);
    const [allNodes, setAllNodes] = useState<any[]>([]);
    const [allArcs, setAllArcs] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const isUpdatingRef = React.useRef(false);
    const [L, setL] = useState<any>(null);

    // Tactical Traffic State
    const [isTrafficMode, setIsTrafficMode] = useState(false);
    const [congestedArcs, setCongestedArcs] = useState<Set<number>>(new Set());

    // Verrou Monotone Absolu (Ref pour éviter les fermetures obsolètes)
    const maxProgressRef = React.useRef(0);

    // Derived State (Kalman Results)
    const progressNum = Math.min(100, (stats?.kalmanState?.distanceCovered ?? 0) * 100); // Cap at 100%
    const [visualProgressNum, setVisualProgressNum] = useState(0);
    const progress = visualProgressNum.toFixed(1);
    const [visualPos, setVisualPos] = useState<[number, number]>([3.8480, 11.5021]);

    // Icons memoized
    const truckIcon = React.useMemo(() => !L ? null : L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white ring-4 ring-blue-500/20 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v12Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    }), [L]);

    const destIcon = React.useMemo(() => !L ? null : L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-12 h-12 bg-red-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white ring-8 ring-red-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
               </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48]
    }), [L]);

    const [pathMetadata, setPathMetadata] = useState<{ total: number, cumulative: number[] }>({ total: 0, cumulative: [] });

    // Fluid Interpolation Loop
    useEffect(() => {
        let frame: number;
        const animate = () => {
            setVisualProgressNum(prev => {
                const diff = progressNum - prev;
                // Si Reset, on saute directement
                if (progressNum < 5 && prev > 50) return progressNum;
                if (Math.abs(diff) < 0.001) return progressNum;
                return prev + diff * 0.03; // Calme et fluide
            });
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [progressNum]);

    // Initial Load: Delivery + Graphe + Path Initial
    useEffect(() => {
        setMounted(true);
        import("leaflet").then(leaf => {
            setL(leaf);
        });
        async function init() {
            try {
                const [d, nodesRes, arcsRes] = await Promise.all([
                    fetchApi(`/api/v1/delivery/${params.id}`),
                    graphApi.getNodes(),
                    graphApi.getArcs()
                ]);
                setDelivery(d);
                setAllNodes(nodesRes);
                setAllArcs(arcsRes);

                // Calculer le chemin A* réel
                const pathRes = await routingApi.calculateShortestPath({
                    origin: d.pickupNodeId,
                    destination: d.dropoffNodeId,
                    costWeights: { alpha: 1, beta: 1, gamma: 0.5, delta: 0, eta: 0.2 }
                });

                const nodeMap = new Map<string, any>(nodesRes.map((n: any) => [n.id, n]));
                const coords = pathRes.path.map((id: string) => {
                    const node = nodeMap.get(id);
                    return node ? ([node.latitude, node.longitude] as [number, number]) : null;
                }).filter((c: any): c is [number, number] => c !== null);

                setPathNodes(coords);

                // Calculer les distances cumulées (Haversine) pour le suivi précis
                if (coords.length > 1) {
                    let total = 0;
                    const cumulative = [0];
                    const R = 6371e3; // Rayon Terre en mètres
                    for (let i = 0; i < coords.length - 1; i++) {
                        const φ1 = coords[i][0] * Math.PI / 180;
                        const φ2 = coords[i + 1][0] * Math.PI / 180;
                        const Δφ = (coords[i + 1][0] - coords[i][0]) * Math.PI / 180;
                        const Δλ = (coords[i + 1][1] - coords[i][1]) * Math.PI / 180;
                        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                            Math.cos(φ1) * Math.cos(φ2) *
                            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        const dist = R * c;
                        total += dist;
                        cumulative.push(total);
                    }
                    setPathMetadata({ total, cumulative });
                }

                if (coords.length > 0) {
                    setVisualPos(coords[0]);
                    setVisualProgressNum(0);
                }
            } catch (error) {
                console.error("Tracking init failure", error);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [params.id]);

    // Polling des Stats Kalman
    const fetchStats = useCallback(async (isPoll = false) => {
        // LOCK PRIORITAIRE : Si une impulsion est en cours, on ignore TOUT poll (même les déjà lancés)
        if (isUpdatingRef.current) return;

        try {
            const s = await fetchApi(`/api/v1/tracking/${params.id}/stats`);

            // RACECONDITION GUARD : On re-vérifie après le fetch async
            if (isUpdatingRef.current) return;

            const serverDist = s?.kalmanState?.distanceCovered;

            // STICKY TELEMETRY: Si le serveur renvoie du vide, on garde notre état actuel
            if (serverDist === undefined || serverDist === null) return;

            // RESET : uniquement si c'est délibéré (proche de 0 et on était loin)
            if (serverDist === 0 && maxProgressRef.current > 0.8) {
                console.info("[TACTICAL] Reset manuel détecté");
                maxProgressRef.current = 0;
                setStats(s);
                return;
            }

            // LOCK : On rejette systématiquement tout ce qui est derrière le maximum déjà atteint
            if (serverDist < maxProgressRef.current - 0.005) {
                // On ne loggue plus pour ne pas polluer la console, on ignore juste les bruits de fond
                return;
            }

            maxProgressRef.current = serverDist;
            setStats(s);
        } catch (e) {
            console.error("Stats poll error", e);
        }
    }, [params.id]);

    useEffect(() => {
        if (wsStats) {
            const serverDist = wsStats?.kalmanState?.distanceCovered;
            if (serverDist === undefined || serverDist === null) return;

            // Monotonicity & Reset Guard
            if (serverDist < maxProgressRef.current - 0.005) {
                if (serverDist === 0 && maxProgressRef.current > 0.8) {
                    maxProgressRef.current = 0;
                    setStats(wsStats);
                }
                return;
            }

            maxProgressRef.current = serverDist;
            setStats(wsStats);
        }
    }, [wsStats]);

    useEffect(() => {
        if (!params.id) return;
        fetchStats(false); // Initial load fallback
    }, [params.id, fetchStats]);

    // Calculate Visual Position based on TOTAL DISTANCE (Precise path following)
    useEffect(() => {
        if (pathNodes.length > 1 && pathMetadata.total > 0) {
            const targetDist = (visualProgressNum / 100) * pathMetadata.total;

            // Si on a atteint 100%, rester à la destination
            if (visualProgressNum >= 99.9) {
                setVisualPos(pathNodes[pathNodes.length - 1]);
                return;
            }

            // Trouver le segment correspondant
            let segmentIndex = 0;
            for (let i = 0; i < pathMetadata.cumulative.length - 1; i++) {
                if (targetDist >= pathMetadata.cumulative[i] && targetDist <= pathMetadata.cumulative[i + 1]) {
                    segmentIndex = i;
                    break;
                }
            }

            // S'assurer qu'on reste dans les limites
            if (segmentIndex >= pathNodes.length - 1) {
                setVisualPos(pathNodes[pathNodes.length - 1]);
                return;
            }

            const start = pathNodes[segmentIndex];
            const end = pathNodes[segmentIndex + 1];

            if (start && end) {
                const segDist = pathMetadata.cumulative[segmentIndex + 1] - pathMetadata.cumulative[segmentIndex];
                const distInSegment = targetDist - pathMetadata.cumulative[segmentIndex];
                const segmentProgress = segDist > 0 ? Math.min(1, distInSegment / segDist) : 1;

                const lat = start[0] + (end[0] - start[0]) * segmentProgress;
                const lng = start[1] + (end[1] - start[1]) * segmentProgress;

                // On limite les mises à jour d'état pour éviter de saturer React
                // RÉACTIVITÉ MAXIMALE : On suit le tracé exactement à chaque frame
                setVisualPos([lat, lng]);
            }
        }
    }, [visualProgressNum, pathNodes, pathMetadata]);

    // Manual Simulation Trigger
    const simulatePulse = async () => {
        // Bloquer si déjà arrivé
        if (maxProgressRef.current >= 1.0) {
            console.info("[TACTICAL] Mission terminée. Réinitialisez pour recommencer.");
            return;
        }

        try {
            setIsUpdating(true);
            isUpdatingRef.current = true;

            // Calcul du prochain pas basé sur le MAX atteint (vitesse recalibrée : 10%)
            const nextProg = Math.min(maxProgressRef.current + 0.10, 1.0);
            maxProgressRef.current = nextProg;

            setStats((prev: any) => ({
                ...prev,
                kalmanState: { ...prev?.kalmanState, distanceCovered: nextProg }
            }));

            await Promise.resolve();

            await fetchApi(`/api/v1/tracking/${params.id}/update`, {
                method: 'POST',
                body: JSON.stringify({
                    currentSpeed: 40 + Math.random() * 15,
                    distanceCovered: nextProg,
                    totalDistance: pathMetadata.total,
                    timestamp: new Date().toISOString()
                })
            });

            // Force immediate refresh to reflect new speed/ETA
            fetchStats(true);

            // On laisse 4s de grâce pour que la DB se stabilise
            setTimeout(() => {
                setIsUpdating(false);
                isUpdatingRef.current = false;
            }, 4000);
        } catch (e) {
            console.error("Pulse sim failed", e);
            setIsUpdating(false);
            isUpdatingRef.current = false;
        }
    };

    // Tactical Traffic Injection
    const injectTraffic = async (origin: [number, number], dest: [number, number]) => {
        try {
            // Trouver l'arc correspondant dans allArcs
            const arc = allArcs.find((a: any) => {
                const o = allNodes.find((n: any) => n.id === a.originId);
                const d = allNodes.find((n: any) => n.id === a.destinationId);
                if (!o || !d) return false;

                // Match coords (approx)
                const matchO = Math.abs(o.latitude - origin[0]) < 0.0001 && Math.abs(o.longitude - origin[1]) < 0.0001;
                const matchD = Math.abs(d.latitude - dest[0]) < 0.0001 && Math.abs(d.longitude - dest[1]) < 0.0001;
                return matchO && matchD;
            });

            if (arc) {
                await fetchApi(`/api/v1/routing/arcs/${arc.id}/traffic`, {
                    method: 'POST',
                    body: JSON.stringify({ trafficFactor: 5.0 }) // High congestion
                });
                setCongestedArcs(prev => new Set(prev).add(arc.id));
                console.info(`[TACTICAL] Trafic injecté sur l'arc ${arc.id}`);

                // Forcer un refresh des stats pour voir l'impact (trafficBias)
                fetchStats(false);
            }
        } catch (e) {
            console.error("Traffic injection failed", e);
        }
    };

    if (!mounted || loading || !L) return <div className="h-screen w-full bg-slate-50 flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest text-[11px]">Connexion au Terminal Tactique...</div>;

    const nodeMap = new Map(allNodes.map(n => [n.id, n]));
    const destCoords = pathNodes[pathNodes.length - 1];

    if (!truckIcon || !destIcon) return null;

    return (
        <div className="relative w-full h-screen bg-slate-50 overflow-hidden">
            {/* BACKGROUND MAP */}
            <div className="absolute inset-0 z-0">
                <MapContainer center={visualPos} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
                    <MapController center={visualPos} />

                    {/* ALL ARCS (DASHED VISIBILITY) */}
                    {allArcs.map((arc, i) => {
                        const start = nodeMap.get(arc.originId);
                        const end = nodeMap.get(arc.destinationId);
                        if (!start || !end) return null;
                        return (
                            <Polyline
                                key={`arc-${i}`}
                                positions={[[start.latitude, start.longitude], [end.latitude, end.longitude]]}
                                pathOptions={{ color: "#475569", weight: 3, opacity: 0.6, dashArray: "10, 10" }}
                            />
                        );
                    })}

                    {/* ALL NODES (BOLD) */}
                    {allNodes.map((node, i) => (
                        <CircleMarker
                            key={`node-${i}`}
                            center={[node.latitude, node.longitude]}
                            radius={6}
                            pathOptions={{ fillColor: "#1e293b", fillOpacity: 0.8, color: "white", weight: 2 }}
                        />
                    ))}

                    {/* PATH SEGMENTS (Interactive) */}
                    {pathNodes.length > 0 && pathNodes.slice(0, -1).map((node, i) => {
                        const next = pathNodes[i + 1];
                        return (
                            <Polyline
                                key={`seg-${i}`}
                                positions={[node, next]}
                                pathOptions={{
                                    color: isTrafficMode ? "#f59e0b" : "#1e293b",
                                    weight: 8,
                                    opacity: isTrafficMode ? 0.7 : 1,
                                    lineCap: "round",
                                    className: isTrafficMode ? 'cursor-crosshair' : ''
                                }}
                                eventHandlers={{
                                    click: (e) => {
                                        if (isTrafficMode) {
                                            injectTraffic(node as [number, number], next as [number, number]);
                                            e.originalEvent.stopPropagation();
                                        }
                                    }
                                }}
                            >
                                <Popup>Segment {i}</Popup>
                            </Polyline>
                        );
                    })}

                    {/* CONGESTION HIGHLIGHTS */}
                    {Array.from(congestedArcs).map(arcId => {
                        const arc = allArcs.find((a: any) => a.id === arcId);
                        if (!arc) return null;
                        const o = allNodes.find((n: any) => n.id === arc.originId);
                        const d = allNodes.find((n: any) => n.id === arc.destinationId);
                        if (!o || !d) return null;
                        return (
                            <Polyline
                                key={`cong-${arcId}`}
                                positions={[[o.latitude, o.longitude], [d.latitude, d.longitude]]}
                                pathOptions={{ color: "#ef4444", weight: 12, opacity: 0.5, lineCap: "round" }}
                            />
                        );
                    })}

                    {/* TARGET PIN */}
                    {destCoords && (
                        <Marker position={destCoords} icon={destIcon}>
                            <Popup><span className="text-[10px] font-black uppercase">POINT_ARRIVÉE</span></Popup>
                        </Marker>
                    )}

                    {/* TRUCK MARKER */}
                    <Marker position={visualPos} icon={truckIcon}>
                        <Popup><span className="text-[10px] font-black uppercase tracking-widest">UNITÉ_{delivery?.id}</span></Popup>
                    </Marker>
                </MapContainer>
            </div>

            {/* OVERLAY: MISSION HEADER (RESTORED REST & PULSE) */}
            <div className="absolute top-6 left-24 right-6 flex justify-between z-10 pointer-events-none">
                <div className="tactical-module px-4 py-2 flex items-center space-x-4 bg-white/90 backdrop-blur shadow-xl border border-slate-200/50">
                    <Navigation className="w-4 h-4 text-slate-500" />
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">MÉTRIQUES_MISSION</p>
                        <p className="text-xs font-black text-slate-900 leading-none uppercase">{delivery?.id}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3 pointer-events-auto">
                    {/* RESET BUTTON */}
                    <button
                        onClick={async () => {
                            try {
                                const res = await fetchApi(`/api/v1/tracking/${params.id}/update`, {
                                    method: 'POST',
                                    body: JSON.stringify({ currentSpeed: 0, distanceCovered: 0, totalDistance: pathMetadata.total, timestamp: new Date().toISOString() })
                                });
                                maxProgressRef.current = 0;
                                setCongestedArcs(new Set());
                                setStats(res);
                            } catch (e) { console.error(e); }
                        }}
                        className="tactical-module px-4 py-2 bg-slate-100 hover:bg-slate-200 border-none text-slate-600 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                    >
                        Réinitialiser
                    </button>

                    <button
                        onClick={() => setIsTrafficMode(!isTrafficMode)}
                        className={`tactical-module px-4 py-2 border-2 transition-all flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest shadow-xl
                            ${isTrafficMode ? 'bg-amber-500 text-white border-amber-600 animate-pulse' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'}`}
                    >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Mode Tactique</span>
                    </button>

                    <button
                        onClick={simulatePulse}
                        disabled={isUpdating}
                        className="tactical-module px-6 py-2 bg-slate-900 border-none text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-2xl flex items-center space-x-3 disabled:opacity-50"
                    >
                        <Zap className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : 'text-blue-400'}`} />
                        <span>{isUpdating ? 'Synchronisation...' : 'Impulser Signal'}</span>
                    </button>
                </div>
            </div>

            {/* OVERLAY: TELEMETRY */}
            <div className="absolute top-24 right-8 w-72 z-10 flex flex-col space-y-4 pointer-events-none">
                {isTrafficMode && (
                    <div className="tactical-module p-3 bg-amber-50 border-l-4 border-l-amber-500 shadow-xl pointer-events-auto animate-in bounce-in duration-500">
                        <div className="flex items-center space-x-2 text-amber-600 mb-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Injection_Prête</span>
                        </div>
                        <p className="text-[9px] text-slate-600 font-bold leading-tight">Cliquez sur un segment du trajet pour simuler une congestion massive (Facteur x5.0).</p>
                    </div>
                )}

                <div className="tactical-module p-4 pointer-events-auto shadow-2xl bg-white/95 backdrop-blur">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                        <div className="flex items-center space-x-2">
                            <Activity className={`w-4 h-4 ${wsConnected ? 'text-green-500' : 'text-slate-400 animate-pulse'}`} />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                Statistiques EKF
                                {wsConnected ? (
                                    <span className="ml-2 text-[8px] text-green-600 bg-green-50 px-1 inline-flex items-center rounded-full border border-green-100">LIVE</span>
                                ) : (
                                    <span className="ml-2 text-[8px] text-slate-400 bg-slate-50 px-1 inline-flex items-center rounded-full border border-slate-100">POLLING</span>
                                )}
                            </span>
                        </div>
                        <div className="flex space-x-1">
                            {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-blue-500/20 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />)}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* ETA Section */}
                        <div className="space-y-2">
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">ETA_ARRIVÉE</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                                {stats?.etaMin ? (
                                    (() => {
                                        try {
                                            const d = new Date(stats.etaMin);
                                            return isNaN(d.getTime()) ? "--:--" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        } catch (e) { return "--:--"; }
                                    })()
                                ) : "--:--"}
                            </p>
                        </div>

                        {/* First Row: Speed and Distance */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Vitesse_Est</p>
                                <p className="text-lg font-black text-slate-900">{stats?.kalmanState?.estimatedSpeed?.toFixed(1) ?? "30.0"} <span className="text-[10px] text-slate-400 uppercase">km/h</span></p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Dist_Restante</p>
                                <p className="text-lg font-black text-slate-900">{stats?.remainingDistance ? (stats.remainingDistance / 1000).toFixed(2) : "--"} <span className="text-[10px] text-slate-400 uppercase">km</span></p>
                            </div>
                        </div>

                        {/* Second Row: Variance and Progress */}
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="space-y-1">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Variance (P)</p>
                                <p className="text-base font-mono font-black text-blue-600">{stats?.confidence ? (1 - stats.confidence).toFixed(4) : "0.012"}</p>
                            </div>
                            <div className="flex justify-center">
                                <div className="w-20 h-20 flex items-center justify-center relative bg-slate-50/50 rounded-full">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                                        <circle cx="36" cy="36" r="28" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                                        <circle cx="36" cy="36" r="28" fill="none" stroke="#3b82f6" strokeWidth="5" strokeDasharray={175} strokeDashoffset={175 - (175 * visualProgressNum / 100)} className="transition-all duration-1000" strokeLinecap="round" />
                                    </svg>
                                    <span className="absolute text-xs font-black">{progress}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-50">
                        <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            <span>Biais de frottement (Trafic)</span>
                            <span className={stats?.kalmanState?.trafficBias > 0.3 ? 'text-red-500' : 'text-slate-600'}>
                                {((stats?.kalmanState?.trafficBias ?? 0) * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${stats?.kalmanState?.trafficBias > 0.3 ? 'bg-red-500' : 'bg-slate-600'}`}
                                style={{ width: `${Math.min(100, (stats?.kalmanState?.trafficBias ?? 0) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* LEFT: TARGET PREVIEW */}
            <div className="absolute bottom-10 left-24 w-64 z-10 pointer-events-none">
                <div className="tactical-module p-4 pointer-events-auto flex items-center space-x-4 bg-white/90 backdrop-blur shadow-2xl border border-slate-200/50">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Cible_Destination</p>
                        <p className="text-xs font-black text-slate-900 leading-none uppercase">{delivery?.dropoffNodeId || '---'}</p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .leaflet-top.leaflet-left, .leaflet-control-zoom { display: none !important; }
                .leaflet-marker-icon, .leaflet-marker-shadow, .leaflet-marker-pane * { 
                    transition: none !important; 
                    animation: none !important;
                }
            `}</style>
        </div >
    );
}
