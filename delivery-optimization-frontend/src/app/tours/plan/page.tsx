"use client";
import React, { useEffect, useState } from "react";
import { toursApi } from "@/lib/api/tours";
import { fetchApi } from "@/lib/api/client";
import { Truck, Plus, Play, Info, CheckCircle2, RotateCcw } from "lucide-react";
import CostBreakdownChart from "@/components/charts/CostBreakdownChart";

const mockCostData = [
    { name: 'Distance', value: 45, color: '#3b82f6' },
    { name: 'Temps', value: 30, color: '#10b981' },
    { name: 'Pénibilité', value: 15, color: '#f59e0b' },
    { name: 'Météo', value: 5, color: '#ef4444' },
    { name: 'Fuel', value: 5, color: '#6366f1' },
];

export default function TourPlanPage() {
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
    const [optimizing, setOptimizing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        async function loadDeliveries() {
            try {
                const data = await fetchApi('/api/v1/delivery');
                // Filter for pending deliveries only for planning
                setDeliveries(data.filter((d: any) => d.status === 'PENDING' || d.status === 'ASSIGNED'));
            } catch (error) {
                console.error("Failed to load deliveries", error);
            } finally {
                setLoading(false);
            }
        }
        loadDeliveries();
    }, []);

    const toggleDelivery = (id: string) => {
        setSelectedDeliveries(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleOptimize = async () => {
        setOptimizing(true);
        try {
            const resp = await toursApi.optimize({
                driverId: "driver_1",
                deliveries: selectedDeliveries.map(id => ({ id })),
                vehicleCapacity: 50,
                useRelayPoints: true
            });
            setResult(resp);
        } catch (error) {
            console.error("Optimization failed", error);
            alert("Erreur lors de l'optimisation. Vérifiez la console.");
        } finally {
            setOptimizing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Planification de Tournée</h1>
                <p className="text-slate-500 mt-2">Assignez des livraisons et optimisez le trajet du coursier.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-slate-900 flex items-center space-x-2">
                                <Truck className="w-5 h-5 text-blue-500" />
                                <span>Livraisons Disponibles</span>
                            </h2>
                            <div className="flex items-center space-x-3">
                                {loading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {selectedDeliveries.length} sélectionnée(s)
                                </span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 h-[400px] overflow-y-auto">
                            {deliveries.length === 0 && !loading ? (
                                <div className="p-8 text-center text-slate-400">
                                    <p>Aucune livraison en attente.</p>
                                </div>
                            ) : (
                                deliveries.map((del) => (
                                    <div
                                        key={del.id}
                                        onClick={() => toggleDelivery(del.id)}
                                        className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${selectedDeliveries.includes(del.id) ? 'bg-blue-50' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-lg ${selectedDeliveries.includes(del.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{del.id}</p>
                                                <p className="text-sm text-slate-500">
                                                    {del.pickupNodeId || del.pickup} → {del.dropoffNodeId || del.dropoff}
                                                </p>
                                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase mt-1">
                                                    {del.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">{del.weight} kg</p>
                                            <p className="text-xs text-slate-400 uppercase">Poids</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Result Section (Unchanged logic, just re-rendering if desired) */}
                    {result && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="font-bold text-slate-900 mb-6 flex items-center space-x-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <span>Tournée Optimisée</span>
                            </h2>
                            <div className="flex items-center space-x-8 mb-8 overflow-x-auto pb-4">
                                {result.orderedStops.map((stop: string, idx: number) => (
                                    <div key={idx} className="flex items-center space-x-4 flex-shrink-0">
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30">
                                                {idx + 1}
                                            </div>
                                            <span className="text-xs font-bold text-slate-900 mt-2">{stop}</span>
                                        </div>
                                        {idx < result.orderedStops.length - 1 && (
                                            <div className="w-12 h-0.5 bg-slate-200 mt-[-20px]"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl mb-6">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Coût Total</p>
                                    <p className="text-lg font-bold text-slate-900">{Math.round(result.totalCost)} U.C.</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Durée Est.</p>
                                    <p className="text-lg font-bold text-slate-900">{Math.round(result.estimatedDuration / 60)} min</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Relais Utilisés</p>
                                    <p className="text-lg font-bold text-slate-900">{result.relayPointsUsed.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Status</p>
                                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase mt-1">Planifié</span>
                                </div>
                            </div>

                            {result.relayPointsUsed.length > 0 && (
                                <div className="border border-emerald-100 bg-emerald-50/50 p-4 rounded-xl">
                                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2">Points de Consolidation (Relais)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.relayPointsUsed.map((name: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full shadow-sm">
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
                            <Info className="w-5 h-5 text-blue-500" />
                            <span>Analyse des Coûts</span>
                        </h2>
                        <CostBreakdownChart data={mockCostData} />
                        <div className="mt-6 space-y-3">
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Le calcul utilise la fonction de coût composite multi-critères ($\alpha, \beta, \gamma, \dots$).
                            </p>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 italic text-xs text-blue-700">
                                L'optimisation réduit le coût de ~15% par rapport à une tournée manuelle.
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={selectedDeliveries.length === 0 || optimizing}
                        onClick={handleOptimize}
                        className={`w-full p-4 rounded-xl font-bold flex items-center justify-center space-x-3 transition-all ${selectedDeliveries.length === 0 || optimizing
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                            }`}
                    >
                        {optimizing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Play className="w-5 h-5 fill-current" />
                        )}
                        <span>{optimizing ? "Optimisation..." : "Lancer l'Optimisation"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
