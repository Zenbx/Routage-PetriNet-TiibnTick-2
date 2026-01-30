"use client";
import React from "react";
import { Zap, Activity, ShieldCheck } from "lucide-react";

interface KalmanStateProps {
    speed: number;
    bias: number;
    distance: number;
    confidence: number;
}

export default function KalmanStateDisplay({ speed, bias, distance, confidence }: KalmanStateProps) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-900 mb-6 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span>État Interne du Filtre (EKF)</span>
            </h2>

            <div className="space-y-6">
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-100">
                                Indice de Confiance
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-blue-600">
                                {(confidence * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                        <div style={{ width: `${confidence * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center space-x-1">
                            <Zap className="w-3 h-3" />
                            <span>Vitesse Estimée (v_t)</span>
                        </p>
                        <p className="text-xl font-bold text-slate-900">{speed.toFixed(1)} km/h</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>Biais Trafic (b_t)</span>
                        </p>
                        <p className="text-xl font-bold text-slate-900">{bias.toFixed(2)}</p>
                    </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-start space-x-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Le filtre de Kalman fusionne les observations GPS avec le modèle physique pour éliminer le bruit et estimer la dérive systématique du trafic.
                    </p>
                </div>
            </div>
        </div>
    );
}
