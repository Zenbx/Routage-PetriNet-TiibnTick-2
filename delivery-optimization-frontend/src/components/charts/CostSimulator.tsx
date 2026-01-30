"use client";
import React, { useState } from "react";
import { Sliders, HelpCircle, Target } from "lucide-react";

interface Weights {
    alpha: number; // distance
    beta: number;  // time
    gamma: number; // penibility
    delta: number; // weather
    eta: number;   // fuel
}

export default function CostSimulator() {
    const [weights, setWeights] = useState<Weights>({
        alpha: 0.20,
        beta: 0.50,
        gamma: 0.15,
        delta: 0.10,
        eta: 0.05
    });

    const updateWeight = (key: keyof Weights, val: number) => {
        const newVal = val / 100;
        const currentSum = Object.entries(weights)
            .filter(([k]) => k !== key)
            .reduce((sum, [, v]) => sum + v, 0);

        // Ensure total is 1
        const remaining = 1.0 - newVal;
        const factor = remaining / currentSum;

        const nextWeights = { ...weights };
        nextWeights[key] = newVal;

        Object.keys(nextWeights).forEach((k) => {
            if (k !== key) {
                (nextWeights as any)[k] *= factor;
            }
        });

        setWeights(nextWeights);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-blue-500" />
                    <span>Configurateur Coût Composite (Section 3.3.1)</span>
                </h2>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg cursor-help">
                    <HelpCircle className="w-4 h-4" />
                </div>
            </div>

            <div className="space-y-6">
                {[
                    { key: 'alpha', label: 'Distance Géo (α)', color: 'bg-blue-500' },
                    { key: 'beta', label: 'Temps Stochastique (β)', color: 'bg-emerald-500' },
                    { key: 'gamma', label: 'Pénibilité Route (γ)', color: 'bg-amber-500' },
                    { key: 'delta', label: 'Pénalité Pluie (δ)', color: 'bg-indigo-500' },
                    { key: 'eta', label: 'Coût Carburant (η)', color: 'bg-rose-500' },
                ].map((w) => (
                    <div key={w.key} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{w.label}</span>
                            <span className="text-sm font-black text-slate-900">{(weights[w.key as keyof Weights] * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="100"
                            value={weights[w.key as keyof Weights] * 100}
                            onChange={(e) => updateWeight(w.key as keyof Weights, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                ))}

                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-4 h-4 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Équation Objective</p>
                    </div>
                    <code className="text-[10px] text-slate-700 bg-white p-2 rounded block border border-slate-100 shadow-sm overflow-x-auto whitespace-nowrap">
                        ω_t(a) = {weights.alpha.toFixed(2)}·d̃(a) + {weights.beta.toFixed(2)}·E[T̃] + {weights.gamma.toFixed(2)}·ρ̃ + {weights.delta.toFixed(2)}·ξ̃ + {weights.eta.toFixed(2)}·c̃_fuel
                    </code>
                </div>

                <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]">
                    Appliquer la configuration
                </button>
            </div>
        </div>
    );
}
