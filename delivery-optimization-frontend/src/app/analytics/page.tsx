"use client";
import React from "react";
import { BarChart3, TrendingUp, Cpu, Globe, Database, Shield, Activity } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

export default function AnalyticsTerminal() {
    const [stats, setStats] = React.useState<any>(null);

    React.useEffect(() => {
        // Assuming fetchApi is a globally available or imported utility function
        // For a real application, you'd define or import fetchApi, e.g.:
        // const fetchApi = async (url: string) => {
        //     const response = await fetch(url);
        //     if (!response.ok) {
        //         throw new Error(`HTTP error! status: ${response.status}`);
        //     }
        //     return response.json();
        // };
        fetchApi('/api/v1/delivery/stats').then(setStats).catch(console.error);
    }, []);

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen ml-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Intelligence Terminal</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Flux de Diagnostics & Performance Systèmes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Performance Module */}
                <div className="tactical-module p-6 lg:col-span-2 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                            <Activity className="w-5 h-5 text-slate-400" />
                            <span className="text-xs font-black uppercase text-slate-700 tracking-tight">Performance Algorithmique (A*)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Status:</span>
                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{stats?.activeDeliveries > 0 ? 'REALTIME_SYNC' : 'OPTIMAL'}</span>
                        </div>
                    </div>

                    <div className="h-64 bg-slate-50/50 rounded-xl flex items-end p-6 space-x-1.5 border border-slate-100/50">
                        {(stats?.hourlyStats || [40, 60, 45, 90, 75, 55, 80, 40, 50, 65, 30, 85, 45, 78, 62, 50, 88]).map((h: number, i: number) => (
                            <div key={i} className="flex-1 bg-slate-200 rounded-t-sm transition-all hover:bg-slate-900 duration-300" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2">
                        <span>INIT_SEQUENCE</span>
                        <span>REAL_TIME_STREAM</span>
                        <span>BUFFER_END</span>
                    </div>
                </div>

                {/* Right Constraints / Status Modules */}
                <div className="space-y-6 flex flex-col">
                    <div className="tactical-module p-6 flex-1">
                        <div className="flex items-center space-x-2 mb-8 border-b border-slate-50 pb-4">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black uppercase text-slate-500">Intégrité Télémétrie</span>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <span>Uptime Cluster</span>
                                    <span className="text-slate-900">99.98%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 w-[99%]"></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <span>Latence API</span>
                                    <span className="text-slate-900">12.4ms</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-400 w-[45%]"></div>
                                </div>
                            </div>

                            <div className="pt-4 grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Bruit GPS (σ)</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">0.142</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">HYS_LIMIT</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">10 UC</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="tactical-module p-6 bg-slate-900 border-none text-white shadow-2xl shadow-slate-900/40 transform hover:-translate-y-1 transition-transform">
                        <div className="flex items-center space-x-2 mb-4 opacity-50">
                            <Database className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">PostGIS Engine</span>
                        </div>
                        <div className="text-2xl font-black tracking-tighter mb-1 uppercase">Stable_V4</div>
                        <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Connexion chiffrée active</p>

                        <div className="mt-6 flex items-center space-x-3">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                                <Cpu className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-white/40 uppercase">Load Balance</p>
                                <p className="text-[10px] font-black">2.41 ops/sec</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend / Info */}
            <div className="ml-2 tactical-module border-transparent bg-transparent flex space-x-8">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded bg-slate-900"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Activité Calcul</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded bg-slate-200"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Idle</span>
                </div>
            </div>
        </div>
    );
}
