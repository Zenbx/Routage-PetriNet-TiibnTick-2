"use client";
import React from "react";

import { useWebSocket } from "@/lib/websocket/useWebSocket";
import { Zap, Activity, Clock } from "lucide-react";

export default function LiveMetrics({ deliveryId }: { deliveryId: string }) {
    const { data, status } = useWebSocket(deliveryId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-slate-500 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">État Connexion</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-bold text-slate-900 capitalize">{status}</span>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-slate-500 mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Position Flux</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                    {data?.pos ? `${data.pos.lat}, ${data.pos.lon}` : "En attente..."}
                </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-slate-500 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Dernière MaJ</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                    {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "--:--:--"}
                </p>
            </div>
        </div>
    );
}
