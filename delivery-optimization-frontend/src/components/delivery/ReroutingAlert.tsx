"use client";
import React from "react";

import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

interface ReroutingAlertProps {
    reason: string;
    costImprovement: number;
    onAccept?: () => void;
    onIgnore?: () => void;
}

export default function ReroutingAlert({ reason, costImprovement, onAccept, onIgnore }: ReroutingAlertProps) {
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start space-x-4">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900">Reroutage Suggéré</h3>
                    <p className="text-sm text-amber-700 mt-1">
                        Une meilleure route a été trouvée en raison de: <span className="font-bold">{reason}</span>.
                    </p>
                    <div className="mt-4 flex items-center space-x-2 text-sm font-bold text-amber-800 bg-white/50 w-fit px-3 py-1 rounded-full">
                        <span>Amélioration:</span>
                        <span className="text-emerald-600">+{costImprovement} U.C.</span>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex space-x-3">
                <button
                    onClick={onAccept}
                    className="flex-1 bg-amber-600 text-white py-2 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accepter</span>
                </button>
                <button
                    onClick={onIgnore}
                    className="px-6 border border-amber-200 text-amber-700 py-2 rounded-xl font-bold hover:bg-amber-100 transition-colors"
                >
                    Ignorer
                </button>
            </div>
        </div>
    );
}
