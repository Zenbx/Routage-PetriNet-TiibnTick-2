'use client';

import { NetStateDTO } from '@/types/petri-net';
import { Clock, Layers, Activity, CheckCircle2 } from 'lucide-react';

interface EngineStateProps {
  netState: NetStateDTO | null;
  isConnected: boolean;
}

export function EngineState({ netState, isConnected }: EngineStateProps) {
  const getTotalTokens = () => {
    if (!netState?.marking) return 0;
    return Object.values(netState.marking).reduce((sum, tokens) => sum + tokens.length, 0);
  };

  const getActivePlace = (): string | null => {
    if (!netState?.marking) return null;
    for (const [place, tokens] of Object.entries(netState.marking)) {
      if (tokens.length > 0) return place;
    }
    return null;
  };

  const getPlaceDetails = () => {
    if (!netState?.marking) return [];
    return Object.entries(netState.marking).map(([place, tokens]) => ({
      place,
      tokens: tokens.length,
      isActive: tokens.length > 0,
    }));
  };

  const activePlace = getActivePlace();
  const totalTokens = getTotalTokens();

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="backdrop-blur-2xl bg-white/40 border border-white/60 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            État du Moteur Petri Net
          </h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            isConnected
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-sm font-semibold">
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-transparent p-4 rounded-xl border border-blue-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-600 font-medium">Places</span>
            </div>
            <p className="text-3xl font-extrabold text-blue-600">
              {netState ? Object.keys(netState.marking).length : 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-transparent p-4 rounded-xl border border-orange-200/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-slate-600 font-medium">Tokens Actifs</span>
            </div>
            <p className="text-3xl font-extrabold text-orange-600">{totalTokens}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-transparent p-4 rounded-xl border border-purple-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-slate-600 font-medium">Temps Réseau</span>
            </div>
            <p className="text-3xl font-extrabold text-purple-600">
              {netState?.currentTime || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Place active */}
      {activePlace && (
        <div className="backdrop-blur-2xl bg-gradient-to-br from-orange-50/80 to-white/40 border border-orange-200/60 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-orange-800 mb-2 uppercase tracking-wider">
            État Actuel
          </h4>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-2xl font-bold text-slate-800">{activePlace}</span>
          </div>
        </div>
      )}

      {/* Détails des places */}
      <div className="backdrop-blur-2xl bg-white/40 border border-white/60 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Marquage Actuel</h4>
        <div className="space-y-2">
          {getPlaceDetails().map(({ place, tokens, isActive }) => (
            <div
              key={place}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-orange-100 border border-orange-300'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <span
                  className={`font-semibold ${
                    isActive ? 'text-orange-800' : 'text-slate-600'
                  }`}
                >
                  {place}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 font-medium">Tokens:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tokens}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info moteur */}
      <div className="backdrop-blur-2xl bg-blue-50/80 border border-blue-200/60 rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-blue-800 mb-3 uppercase tracking-wider">
          À propos du Moteur
        </h4>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <strong>Type:</strong> Réseau de Petri Coloré Temporisé (CTPN)
          </p>
          <p>
            <strong>Workflow:</strong> Delivery Lifecycle Management
          </p>
          <p>
            <strong>Validations:</strong> Transitions d'état formelles avec contraintes temporelles
          </p>
          <p>
            <strong>API:</strong> http://localhost:8081
          </p>
        </div>
      </div>
    </div>
  );
}
