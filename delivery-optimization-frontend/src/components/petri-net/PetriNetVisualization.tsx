'use client';

import { NetStateDTO, PlaceNode, TransitionNode } from '@/types/petri-net';
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PetriNetVisualizationProps {
  netState: NetStateDTO | null;
  onFireTransition?: (transitionId: string) => void;
  autoPlay?: boolean;
}

// Workflow de livraison standard
const DELIVERY_WORKFLOW = {
  places: [
    { id: 'PENDING', label: 'En attente', x: 100, y: 200, color: 'text-slate-400' },
    { id: 'ASSIGNED', label: 'Assignée', x: 300, y: 200, color: 'text-blue-400' },
    { id: 'IN_TRANSIT', label: 'En transit', x: 500, y: 200, color: 'text-orange-400' },
    { id: 'DELIVERED', label: 'Livrée', x: 700, y: 100, color: 'text-green-400' },
    { id: 'FAILED', label: 'Échouée', x: 700, y: 300, color: 'text-red-400' },
  ],
  transitions: [
    { id: 'ASSIGN', label: 'Assigner', from: 'PENDING', to: 'ASSIGNED' },
    { id: 'START', label: 'Démarrer', from: 'ASSIGNED', to: 'IN_TRANSIT' },
    { id: 'COMPLETE', label: 'Compléter', from: 'IN_TRANSIT', to: 'DELIVERED' },
    { id: 'FAIL', label: 'Échec', from: 'IN_TRANSIT', to: 'FAILED' },
  ],
};

export function PetriNetVisualization({
  netState,
  onFireTransition,
  autoPlay = false,
}: PetriNetVisualizationProps) {
  const [firingTransition, setFiringTransition] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  // Calculer le nombre de tokens par place
  const getTokenCount = (placeId: string): number => {
    if (!netState?.marking) return 0;
    return netState.marking[placeId]?.length || 0;
  };

  // Déterminer si une transition est activable
  const isTransitionEnabled = (transition: typeof DELIVERY_WORKFLOW.transitions[0]): boolean => {
    return getTokenCount(transition.from) > 0;
  };

  // Déclencher une transition avec animation
  const handleFireTransition = async (transitionId: string) => {
    if (firingTransition) return;

    setFiringTransition(transitionId);

    // Animation
    await new Promise(resolve => setTimeout(resolve, 600));

    if (onFireTransition) {
      onFireTransition(transitionId);
    }

    setFiringTransition(null);
  };

  // Calculer les coordonnées des transitions (entre deux places)
  const getTransitionCoords = (transition: typeof DELIVERY_WORKFLOW.transitions[0]) => {
    const fromPlace = DELIVERY_WORKFLOW.places.find(p => p.id === transition.from);
    const toPlace = DELIVERY_WORKFLOW.places.find(p => p.id === transition.to);

    if (!fromPlace || !toPlace) return { x: 0, y: 0 };

    return {
      x: (fromPlace.x + toPlace.x) / 2,
      y: (fromPlace.y + toPlace.y) / 2,
    };
  };

  return (
    <div className="relative w-full h-full bg-slate-900/5 rounded-2xl backdrop-blur-sm border border-slate-200/40 overflow-hidden">
      {/* Contrôles */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="px-3 py-2 bg-white/40 backdrop-blur-xl border border-white/60 rounded-lg hover:bg-white/60 transition-all shadow-lg"
        >
          {isAutoPlaying ? (
            <Pause className="w-4 h-4 text-slate-700" />
          ) : (
            <Play className="w-4 h-4 text-slate-700" />
          )}
        </button>
        <button className="px-3 py-2 bg-white/40 backdrop-blur-xl border border-white/60 rounded-lg hover:bg-white/60 transition-all shadow-lg">
          <RotateCcw className="w-4 h-4 text-slate-700" />
        </button>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full"
        viewBox="0 0 900 500"
        style={{ minHeight: '500px' }}
      >
        <defs>
          {/* Gradient pour les places */}
          <radialGradient id="placeGradient">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.6)" />
          </radialGradient>

          {/* Filtre de blur pour effet glassmorphique */}
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>

          {/* Marker pour les flèches */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
          </marker>

          {/* Marker pour les flèches animées */}
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#f97316" />
          </marker>
        </defs>

        {/* Arcs (lignes entre places et transitions) */}
        {DELIVERY_WORKFLOW.transitions.map(transition => {
          const fromPlace = DELIVERY_WORKFLOW.places.find(p => p.id === transition.from);
          const toPlace = DELIVERY_WORKFLOW.places.find(p => p.id === transition.to);
          const transCoords = getTransitionCoords(transition);
          const isFiring = firingTransition === transition.id;
          const isEnabled = isTransitionEnabled(transition);

          if (!fromPlace || !toPlace) return null;

          return (
            <g key={transition.id}>
              {/* Arc: Place source → Transition */}
              <line
                x1={fromPlace.x}
                y1={fromPlace.y}
                x2={transCoords.x - 30}
                y2={transCoords.y}
                stroke={isFiring ? '#f97316' : isEnabled ? '#64748b' : '#cbd5e1'}
                strokeWidth={isFiring ? 3 : 2}
                markerEnd={isFiring ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                className={isFiring ? 'animate-pulse' : ''}
              />

              {/* Arc: Transition → Place cible */}
              <line
                x1={transCoords.x + 30}
                y1={transCoords.y}
                x2={toPlace.x}
                y2={toPlace.y}
                stroke={isFiring ? '#f97316' : isEnabled ? '#64748b' : '#cbd5e1'}
                strokeWidth={isFiring ? 3 : 2}
                markerEnd={isFiring ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                className={isFiring ? 'animate-pulse' : ''}
              />
            </g>
          );
        })}

        {/* Places (états) */}
        {DELIVERY_WORKFLOW.places.map(place => {
          const tokenCount = getTokenCount(place.id);
          const hasTokens = tokenCount > 0;

          return (
            <g key={place.id}>
              {/* Cercle principal de la place */}
              <circle
                cx={place.x}
                cy={place.y}
                r="40"
                fill="url(#placeGradient)"
                stroke={hasTokens ? '#f97316' : '#cbd5e1'}
                strokeWidth={hasTokens ? 3 : 2}
                filter="url(#blur)"
                className="transition-all duration-300"
              />

              {/* Tokens (jetons) dans la place */}
              {hasTokens && (
                <>
                  <circle
                    cx={place.x}
                    cy={place.y}
                    r="12"
                    fill="#f97316"
                    className="animate-pulse"
                  />
                  {tokenCount > 1 && (
                    <text
                      x={place.x}
                      y={place.y + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {tokenCount}
                    </text>
                  )}
                </>
              )}

              {/* Label de la place */}
              <text
                x={place.x}
                y={place.y + 65}
                textAnchor="middle"
                fill="#1e293b"
                fontSize="14"
                fontWeight="600"
                className={place.color}
              >
                {place.label}
              </text>
            </g>
          );
        })}

        {/* Transitions (rectangles) */}
        {DELIVERY_WORKFLOW.transitions.map(transition => {
          const coords = getTransitionCoords(transition);
          const isEnabled = isTransitionEnabled(transition);
          const isFiring = firingTransition === transition.id;

          return (
            <g
              key={transition.id}
              className={isEnabled ? 'cursor-pointer' : 'opacity-50'}
              onClick={() => isEnabled && handleFireTransition(transition.id)}
            >
              {/* Rectangle de la transition */}
              <rect
                x={coords.x - 30}
                y={coords.y - 20}
                width="60"
                height="40"
                fill={isFiring ? '#f97316' : isEnabled ? '#3b82f6' : '#cbd5e1'}
                stroke="white"
                strokeWidth="2"
                rx="4"
                filter="url(#blur)"
                className={`transition-all duration-300 ${isFiring ? 'animate-pulse' : ''}`}
              />

              {/* Label de la transition */}
              <text
                x={coords.x}
                y={coords.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="600"
                className="pointer-events-none"
              >
                {transition.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Légende */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/40 backdrop-blur-xl border border-white/60 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white/60" />
            <span className="text-slate-700 font-medium">Place (état)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded bg-blue-500" />
            <span className="text-slate-700 font-medium">Transition</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-slate-700 font-medium">Token (livraison)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-slate-400" />
            <svg width="8" height="8">
              <polygon points="0 0, 8 4, 0 8" fill="#64748b" />
            </svg>
            <span className="text-slate-700 font-medium">Arc</span>
          </div>
        </div>
      </div>
    </div>
  );
}
