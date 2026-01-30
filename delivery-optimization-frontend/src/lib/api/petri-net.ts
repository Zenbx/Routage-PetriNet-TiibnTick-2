import { NetDTO, NetStateDTO, TokenDTO } from '@/types/petri-net';

const PETRI_NET_API_URL = process.env.NEXT_PUBLIC_PETRI_NET_API_URL || 'http://localhost:8081';

export class PetriNetApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'PetriNetApiError';
  }
}

async function fetchPetriNet(endpoint: string, options: RequestInit = {}) {
  console.log(`[PETRI-NET] Fetching: ${PETRI_NET_API_URL}${endpoint}`);

  try {
    const response = await fetch(`${PETRI_NET_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.warn('[PETRI-NET] Failed to parse response:', text);
    }

    if (!response.ok) {
      console.error(`[PETRI-NET] Error (${response.status}):`, data || text);
      throw new PetriNetApiError(
        response.status,
        data?.message || response.statusText || 'Petri Net API error'
      );
    }

    console.log(`[PETRI-NET] Success (${response.status})`);
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[PETRI-NET] Network error');
      throw new PetriNetApiError(
        0,
        'Impossible de se connecter à l\'API Petri Net sur ' + PETRI_NET_API_URL
      );
    }
    throw error;
  }
}

export const petriNetApi = {
  /**
   * Vérifie si l'API Petri Net est disponible
   */
  async health(): Promise<string> {
    return fetchPetriNet('/api/nets/health');
  },

  /**
   * Crée un nouveau réseau de Petri
   */
  async createNet(netDto: NetDTO): Promise<string> {
    return fetchPetriNet('/api/nets', {
      method: 'POST',
      body: JSON.stringify(netDto),
    });
  },

  /**
   * Obtient l'état d'un réseau de Petri
   */
  async getNetState(netId: string): Promise<NetStateDTO> {
    return fetchPetriNet(`/api/nets/${netId}`);
  },

  /**
   * Déclenche une transition dans un réseau
   */
  async fireTransition(
    netId: string,
    transitionId: string,
    binding: Record<string, TokenDTO[]> = {}
  ): Promise<void> {
    return fetchPetriNet(`/api/nets/${netId}/fire/${transitionId}`, {
      method: 'POST',
      body: JSON.stringify(binding),
    });
  },

  /**
   * Obtient les informations complètes d'un réseau (structure + état)
   * Note: Cette méthode combine plusieurs appels
   */
  async getNetComplete(netId: string): Promise<{ state: NetStateDTO }> {
    const state = await this.getNetState(netId);
    return { state };
  },
};
