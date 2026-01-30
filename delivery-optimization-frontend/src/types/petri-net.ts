/**
 * Types pour l'API Petri Net
 * Correspondent aux DTOs Java
 */

export interface TokenDTO {
  value: any;
  creationTimestamp: number;
}

export interface ArcDTO {
  id: string;
  source: string;
  target: string;
  weight?: number;
}

export interface TransitionDTO {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface NetDTO {
  name: string;
  places: string[];
  transitions: TransitionDTO[];
  arcs: ArcDTO[];
}

export interface NetStateDTO {
  currentTime: number;
  marking: Record<string, TokenDTO[]>; // Place ID -> Tokens
}

export interface PetriNetVisualization {
  id: string;
  name: string;
  places: PlaceNode[];
  transitions: TransitionNode[];
  currentState: NetStateDTO;
}

export interface PlaceNode {
  id: string;
  label: string;
  x: number;
  y: number;
  tokens: number;
  isActive: boolean;
}

export interface TransitionNode {
  id: string;
  label: string;
  from: string;
  to: string;
  x: number;
  y: number;
  isEnabled: boolean;
  isFiring: boolean;
}

export interface DeliveryStatus {
  deliveryId: string;
  currentPlace: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  lastTransition?: string;
  timestamp: number;
}
