"use client";
import React from "react";

import { CheckCircle2, Circle, Clock, MapPin, Truck } from "lucide-react";

const steps = [
    { status: 'DELIVERED', label: 'Livré', time: '14:30', desc: 'Livraison effectuée avec succès.', completed: true },
    { status: 'IN_TRANSIT', label: 'En Transit', time: '14:05', desc: 'Reroutage évité (Hystérésis non atteinte).', completed: true },
    { status: 'PICKED_UP', label: 'Collecté', time: '13:45', desc: 'Colis récupéré au point relais Bastos.', completed: true },
    { status: 'ASSIGNED', label: 'Assigné', time: '13:15', desc: 'Coursier Jean Express assigné à la tâche.', completed: true },
    { status: 'PENDING', label: 'En attente', time: '13:00', desc: 'Demande reçue.', completed: true },
];

export default function DeliveryTimeline() {
    return (
        <div className="space-y-8">
            {steps.map((step, idx) => (
                <div key={idx} className="flex space-x-4 relative">
                    {idx < steps.length - 1 && (
                        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-slate-100"></div>
                    )}
                    <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center ${step.completed ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                        {step.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3 fill-current" />}
                    </div>
                    <div className="flex-1 pb-8">
                        <div className="flex justify-between items-start">
                            <h4 className={`font-bold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                                {step.label}
                            </h4>
                            <span className="text-xs font-mono text-slate-400">{step.time}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
