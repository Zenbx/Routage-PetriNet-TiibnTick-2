"use client";
import React, { useEffect, useState } from "react";
import { Package, Search, Navigation, Filter, MapPin, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api/client";
import { format } from "date-fns";

export default function DeliveryTacticalList() {
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchApi('/api/v1/delivery');
                setDeliveries(data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-center ml-20">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Mission Control</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestion Tactique des Flux de Livraison</p>
                </div>

                <div className="flex space-x-3">
                    <div className="tactical-module flex items-center px-4 py-2 space-x-2 bg-white/80">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input type="text" placeholder="FILTER_MISSIONS..." className="bg-transparent border-none text-[10px] focus:ring-0 w-48 font-bold text-slate-700" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ml-20">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="tactical-module h-40 animate-pulse bg-white/40" />)
                ) : deliveries.map((d) => (
                    <div key={d.id} className="tactical-module group hover:scale-[1.02] transition-all duration-300 flex flex-col">
                        <div className="tactical-header">
                            <div className="flex items-center space-x-2">
                                <div className="p-1.5 bg-slate-100 rounded text-slate-600">
                                    <Package className="w-3 h-3" />
                                </div>
                                <span className="text-[11px] font-black text-slate-900 tracking-tight">{d.id}</span>
                            </div>
                            <span className={`badge-tactical ${d.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' :
                                    d.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'
                                }`}>
                                {d.status}
                            </span>
                        </div>

                        <div className="p-5 flex-1 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Logistique</p>
                                    <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-700">
                                        <MapPin className="w-3 h-3 text-slate-300" />
                                        <span>{d.pickupNodeId} → {d.dropoffNodeId}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Masse</p>
                                    <p className="text-xs font-mono font-black text-slate-900">{d.weight}KG</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                                        <Calendar className="w-3 h-3" />
                                        <span>{format(new Date(d.createdAt), 'dd.MM')}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{format(new Date(d.createdAt), 'HH:mm')}</span>
                                    </div>
                                </div>

                                <Link
                                    href={`/delivery/${d.id}?demo=${d.status !== 'DELIVERED'}`}
                                    className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded hover:bg-blue-600 transition-colors flex items-center space-x-2"
                                >
                                    <Navigation className="w-3 h-3" />
                                    <span>{d.status === 'DELIVERED' ? 'REVOIR' : 'TRACKER'}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
