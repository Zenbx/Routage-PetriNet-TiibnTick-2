"use client";
import React, { useEffect, useState } from "react";
import { Route, AlertCircle, GitCompare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api/client";

interface RerouteEvent {
    deliveryId: string;
    reason: string;
    currentCost: number;
    newCost: number;
    hysteresisMet: boolean;
    timestamp: string;
}

export default function ReroutingMonitorPage() {
    const [events, setEvents] = useState<RerouteEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mocking some events since we don't have a list endpoint for events yet, 
        // but we'll base it on logic. In a real app, we'd have GET /api/v1/reroute-events
        const mockEvents: RerouteEvent[] = [
            {
                deliveryId: "DEL-4509",
                reason: "TRAFFIC_CONGESTION",
                currentCost: 45.2,
                newCost: 38.5,
                hysteresisMet: true,
                timestamp: new Date().toISOString()
            }
        ];
        setEvents(mockEvents);
        setLoading(false);
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Moniteur de Reroutage</h1>
                    <p className="text-slate-500 mt-2">Suivi des décisions d'optimisation basées sur l'hystérésis théorique.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Chargement...</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Aucun événement de reroutage détecté.</div>
                ) : events.map((event, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex space-x-4">
                                <div className={`p-3 rounded-xl ${event.hysteresisMet ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Route className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-slate-900">{event.deliveryId}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${event.hysteresisMet ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {event.hysteresisMet ? 'Approuvé' : 'Rejeté (Hystérésis)'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 flex items-center space-x-1">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Raison: {event.reason}</span>
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={`/delivery/${event.deliveryId}/rerouting`}
                                className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 underline decoration-blue-600/30"
                            >
                                <span>Analyse complète</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Coût Actuel</p>
                                <p className="text-xl font-bold text-slate-900">{event.currentCost} U.C.</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Coût Alternatif</p>
                                <p className="text-xl font-bold text-blue-600">{event.newCost} U.C.</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Gain Net</p>
                                    <p className="text-xl font-bold text-emerald-600">{(event.currentCost - event.newCost).toFixed(1)} U.C.</p>
                                </div>
                                <GitCompare className="w-8 h-8 text-emerald-200" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
