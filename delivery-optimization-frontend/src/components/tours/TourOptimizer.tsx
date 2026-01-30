"use client";

import React, { useState } from "react";
import { Truck, Zap, ListChecks } from "lucide-react";
import { toursApi } from "@/lib/api/tours";

interface TourOptimizerProps {
    onOptimizationComplete?: (result: any) => void;
}

export default function TourOptimizer({ onOptimizationComplete }: TourOptimizerProps) {
    const [loading, setLoading] = useState(false);

    const handleOptimize = async () => {
        setLoading(true);
        try {
            const result = await toursApi.optimize({
                driverId: "driver_1",
                deliveries: [], // Simplified for component demo
                vehicleCapacity: 50,
                useRelayPoints: true
            });
            onOptimizationComplete?.(result);
        } catch (error) {
            console.error("Optimization error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span>Moteur d'Optimisation</span>
                </h3>
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">VRP/MTZ Ready</span>
            </div>

            <div className="space-y-4">
                <div className="flex items-start space-x-3 text-sm text-slate-500">
                    <ListChecks className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>L'optimisation utilise l'élimination de sous-tours Miller-Tucker-Zemlin.</p>
                </div>

                <button
                    onClick={handleOptimize}
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Truck className="w-4 h-4" />
                            <span>Démarrer Solver VRP</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
