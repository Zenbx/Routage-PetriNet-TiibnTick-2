'use client';

import { useState, useEffect, useCallback } from 'react';
import { PetriNetVisualization } from '@/components/petri-net/PetriNetVisualization';
import { EngineState } from '@/components/petri-net/EngineState';
import { petriNetApi } from '@/lib/api/petri-net';
import { fetchApi } from '@/lib/api/client';
import { NetStateDTO } from '@/types/petri-net';
import { showToast } from '@/components/ui/Toast';
import { RefreshCw, Zap, Network } from 'lucide-react';

interface Delivery {
  id: string;
  status: string;
  pickupNodeId: string;
  dropoffNodeId: string;
}

export default function PetriNetPage() {
  const [netState, setNetState] = useState<NetStateDTO | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Vérifier la santé de l'API Petri Net
  const checkHealth = useCallback(async () => {
    try {
      await petriNetApi.health();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      console.error('Petri Net API not available:', error);
    }
  }, []);

  // Charger les livraisons
  const loadDeliveries = useCallback(async () => {
    try {
      const data = await fetchApi('/api/v1/delivery');
      setDeliveries(data || []);

      // Sélectionner automatiquement la première livraison en transit
      const inTransit = data?.find((d: Delivery) => d.status === 'IN_TRANSIT');
      if (inTransit && !selectedDelivery) {
        setSelectedDelivery(inTransit.id);
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    }
  }, [selectedDelivery]);

  // Charger l'état du réseau Petri Net pour une livraison
  const loadNetState = useCallback(async (deliveryId: string) => {
    if (!isConnected) return;

    try {
      const state = await petriNetApi.getNetState(deliveryId);
      setNetState(state);
    } catch (error) {
      console.warn('Failed to load Petri Net state:', error);
      // Créer un état simulé si le réseau n'existe pas
      setNetState(createMockState(deliveryId));
    }
  }, [isConnected]);

  // Créer un état simulé basé sur le statut de la livraison
  const createMockState = (deliveryId: string): NetStateDTO => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    const marking: Record<string, any[]> = {
      PENDING: [],
      ASSIGNED: [],
      IN_TRANSIT: [],
      DELIVERED: [],
      FAILED: [],
    };

    if (delivery) {
      const currentPlace = delivery.status;
      marking[currentPlace] = [{ value: deliveryId, creationTimestamp: Date.now() }];
    }

    return {
      currentTime: Date.now(),
      marking,
    };
  };

  // Déclencher une transition
  const handleFireTransition = async (transitionId: string) => {
    if (!selectedDelivery || !isConnected) {
      showToast('Sélectionnez une livraison d\'abord', 'warning');
      return;
    }

    try {
      showToast(`Transition ${transitionId} en cours...`, 'info', 2000);

      // Mapper la transition vers le nouveau statut
      const statusMap: Record<string, string> = {
        ASSIGN: 'ASSIGNED',
        START: 'IN_TRANSIT',
        COMPLETE: 'DELIVERED',
        FAIL: 'FAILED',
      };

      const newStatus = statusMap[transitionId];

      if (newStatus) {
        // Appeler l'API de transition de la livraison (qui appellera Petri Net en backend)
        await fetchApi(`/api/v1/delivery/${selectedDelivery}/state-transition`, {
          method: 'POST',
          body: JSON.stringify({
            status: newStatus,
            timestamp: new Date().toISOString(),
          }),
        });

        showToast(`Transition ${transitionId} réussie!`, 'success');

        // Recharger l'état
        await loadNetState(selectedDelivery);
        await loadDeliveries();
      }
    } catch (error) {
      showToast('Échec de la transition', 'error');
      console.error('Transition failed:', error);
    }
  };

  // Initialiser un workflow pour une nouvelle livraison
  const handleInitializeWorkflow = async () => {
    if (!selectedDelivery || !isConnected) return;

    try {
      showToast('Initialisation du workflow Petri Net...', 'info', 2000);

      // Créer le réseau Petri Net via l'API
      await petriNetApi.createNet({
        name: `Delivery-${selectedDelivery}`,
        places: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
        transitions: [
          { id: 'ASSIGN', from: 'PENDING', to: 'ASSIGNED' },
          { id: 'START', from: 'ASSIGNED', to: 'IN_TRANSIT' },
          { id: 'COMPLETE', from: 'IN_TRANSIT', to: 'DELIVERED' },
          { id: 'FAIL', from: 'IN_TRANSIT', to: 'FAILED' },
        ],
        arcs: [],
      });

      await loadNetState(selectedDelivery);
      showToast('Workflow initialisé!', 'success');
    } catch (error) {
      showToast('Échec de l\'initialisation', 'error');
      console.error('Failed to initialize workflow:', error);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && selectedDelivery) {
      const interval = setInterval(() => {
        loadNetState(selectedDelivery);
        loadDeliveries();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedDelivery, loadNetState, loadDeliveries]);

  // Initialisation
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await checkHealth();
      await loadDeliveries();
      setIsLoading(false);
    };

    init();
  }, [checkHealth, loadDeliveries]);

  // Charger l'état quand une livraison est sélectionnée
  useEffect(() => {
    if (selectedDelivery) {
      loadNetState(selectedDelivery);
    }
  }, [selectedDelivery, loadNetState]);

  const selectedDeliveryData = deliveries.find(d => d.id === selectedDelivery);

  return (
    <div className="h-screen w-full overflow-auto bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="backdrop-blur-2xl bg-white/40 border border-white/60 rounded-3xl shadow-2xl shadow-black/10 mb-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 flex items-center gap-3 mb-2">
              <Network className="w-10 h-10 text-blue-600" />
              Moteur Petri Net
            </h1>
            <p className="text-slate-600 font-medium">
              Visualisation temps réel des réseaux de Petri colorés temporisés
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleInitializeWorkflow}
              disabled={!selectedDelivery || !isConnected}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Initialiser Workflow
            </button>

            <button
              onClick={() => {
                if (selectedDelivery) {
                  loadNetState(selectedDelivery);
                  loadDeliveries();
                }
              }}
              className="px-4 py-2 bg-white/60 backdrop-blur-xl border border-white/80 rounded-xl font-semibold hover:bg-white/80 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Rafraîchir
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-xl border border-white/80 rounded-xl cursor-pointer hover:bg-white/80 transition-all">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="font-semibold text-sm">Auto-refresh</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sélection de livraison */}
      {deliveries.length > 0 && (
        <div className="backdrop-blur-2xl bg-white/40 border border-white/60 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sélectionner une Livraison</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {deliveries.map(delivery => (
              <button
                key={delivery.id}
                onClick={() => setSelectedDelivery(delivery.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedDelivery === delivery.id
                    ? 'bg-blue-100 border-blue-500 shadow-lg'
                    : 'bg-white/60 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-800 mb-1">
                  {delivery.id.substring(0, 8)}...
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                  delivery.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-700' :
                  delivery.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {delivery.status}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Chargement du moteur Petri Net...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visualisation du réseau */}
          <div className="lg:col-span-2">
            <PetriNetVisualization
              netState={netState}
              onFireTransition={handleFireTransition}
            />
          </div>

          {/* État du moteur */}
          <div className="lg:col-span-1">
            <EngineState netState={netState} isConnected={isConnected} />
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="mt-6 backdrop-blur-2xl bg-red-50/80 border border-red-200/60 rounded-2xl p-6">
          <h4 className="text-red-800 font-bold mb-2">⚠️ API Petri Net Indisponible</h4>
          <p className="text-red-700 text-sm mb-3">
            L'API Petri Net n'est pas accessible. Vérifiez qu'elle est démarrée sur le port 8081.
          </p>
          <button
            onClick={checkHealth}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
          >
            Réessayer la connexion
          </button>
        </div>
      )}
    </div>
  );
}
