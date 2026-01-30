"use client";
import React from 'react';
import { Sliders, Activity, Wind, CloudRain, Fuel, Timer, Navigation, Zap } from 'lucide-react';

export interface CostWeights {
    alpha: number; // Distance
    beta: number;  // Time
    gamma: number; // Penibility
    delta: number; // Weather
    eta: number;   // Fuel
}

interface CostSimulatorProps {
    weights: CostWeights;
    onChange: (weights: CostWeights) => void;
    onRecalculate: () => void;
    loading?: boolean;
    compact?: boolean;
}

export default function CostSimulator({ weights, onChange, onRecalculate, loading, compact }: CostSimulatorProps) {
    const handleChange = (key: keyof CostWeights, value: number) => {
        onChange({ ...weights, [key]: value });
    };

    const config = [
        { key: 'alpha', label: 'Distance', icon: Navigation, color: 'text-blue-500', bg: 'bg-blue-500' },
        { key: 'beta', label: 'Temps', icon: Timer, color: 'text-emerald-500', bg: 'bg-emerald-500' },
        { key: 'gamma', label: 'Pénibilité', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500' },
        { key: 'delta', label: 'Météo', icon: CloudRain, color: 'text-red-500', bg: 'bg-red-500' },
        { key: 'eta', label: 'Carburant', icon: Fuel, color: 'text-indigo-500', bg: 'bg-indigo-500' },
    ];

    return (
        <div className={`${compact ? 'p-0 shadow-none border-none bg-transparent' : 'backdrop-blur-2xl bg-white/40 border border-white/60 rounded-3xl shadow-2xl shadow-black/10 p-6 pointer-events-auto'}`}>
            {!compact && (
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center backdrop-blur-sm">
                        <Sliders className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-800">Poids SPP</span>
                </div>
            )}

            <div className="space-y-4">
                {config.map((item) => (
                    <div key={item.key} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.label}</span>
                            </div>
                            <span className="text-[11px] font-mono font-black text-slate-900">{(weights[item.key as keyof CostWeights] * 100).toFixed(0)}%</span>
                        </div>
                        <div className="relative h-2 w-full bg-white/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/60 group">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={weights[item.key as keyof CostWeights]}
                                onChange={(e) => handleChange(item.key as keyof CostWeights, parseFloat(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div
                                className={`absolute inset-y-0 left-0 ${item.bg} transition-all duration-300 opacity-70 group-hover:opacity-100`}
                                style={{ width: `${weights[item.key as keyof CostWeights] * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {!compact && (
                <div className="mt-6 pt-6 border-t border-slate-200/40 space-y-3">
                    <button
                        onClick={onRecalculate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center space-x-3 transition-all shadow-2xl shadow-slate-900/30 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Zap className="w-4 h-4 text-amber-400 fill-current" />
                                <span>Calculer SPP</span>
                            </>
                        )}
                    </button>

                    <p className="text-[9px] text-slate-500 font-medium text-center uppercase tracking-widest leading-relaxed px-2">
                        Algorithme A* avec coût composite personnalisé
                    </p>
                </div>
            )}
        </div>
    );
}
