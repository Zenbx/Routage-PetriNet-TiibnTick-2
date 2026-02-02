"use client";
import React, { useState } from 'react';
import { Activity, CloudRain, AlertTriangle, RotateCcw, Zap } from 'lucide-react';
import { fetchApi } from '@/lib/api/client';

export default function TacticalScenarios() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const executeScenario = async (endpoint: string, label: string) => {
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetchApi(endpoint, {
                method: 'POST'
            });

            setMessage(`✅ ${label}: ${response.message || 'Scénario activé'}`);

            // Auto-clear message après 5 secondes
            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            setMessage(`❌ Erreur: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const scenarios = [
        {
            id: 'rush-hour',
            name: 'Heure de Pointe',
            description: 'Congestion 3-5× sur routes principales',
            icon: Activity,
            color: 'amber',
            endpoint: '/api/v1/tactical/scenario/rush-hour'
        },
        {
            id: 'accident',
            name: 'Accident Majeur',
            description: 'Blocage complet d\'une route (10×)',
            icon: AlertTriangle,
            color: 'red',
            endpoint: '/api/v1/tactical/scenario/accident'
        },
        {
            id: 'weather',
            name: 'Tempête',
            description: 'Impact météo 2-4× sur tout le réseau',
            icon: CloudRain,
            color: 'blue',
            endpoint: '/api/v1/tactical/scenario/weather?intensity=moderate'
        }
    ];

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-indigo-600" />
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    Simulations Tactiques
                </h2>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Testez comment le système réagit à différents scénarios de congestion massive.
                L'ETA et les routes seront recalculés automatiquement.
            </p>

            {/* Scénarios */}
            <div className="grid grid-cols-1 gap-3 mb-4">
                {scenarios.map(scenario => {
                    const Icon = scenario.icon;
                    const colorClasses = {
                        amber: 'bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-700',
                        red: 'bg-red-50 border-red-200 hover:border-red-400 text-red-700',
                        blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-700'
                    }[scenario.color];

                    return (
                        <button
                            key={scenario.id}
                            onClick={() => executeScenario(scenario.endpoint, scenario.name)}
                            disabled={loading}
                            className={`${colorClasses} p-4 rounded-xl border-2 transition-all text-left disabled:opacity-50 hover:shadow-lg active:scale-95`}
                        >
                            <div className="flex items-start space-x-3">
                                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-sm uppercase tracking-wide mb-1">
                                        {scenario.name}
                                    </div>
                                    <div className="text-xs opacity-80">
                                        {scenario.description}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Bouton Reset */}
            <button
                onClick={() => executeScenario('/api/v1/tactical/reset', 'Réinitialisation')}
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 active:scale-95 shadow-lg"
            >
                <RotateCcw className="w-4 h-4" />
                <span className="font-black text-xs uppercase tracking-widest">
                    {loading ? 'Traitement...' : 'Réinitialiser Conditions'}
                </span>
            </button>

            {/* Message de statut */}
            {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm font-mono ${
                    message.startsWith('✅')
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message}
                </div>
            )}

            {/* Info */}
            <div className="mt-6 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="text-xs text-indigo-700 space-y-1">
                    <p className="font-bold">💡 Impact sur le système:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Les camions ralentissent automatiquement</li>
                        <li>L'ETA est recalculé en temps réel</li>
                        <li>Les routes peuvent être reroutées</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
