export type NodeType = 'CLIENT' | 'RELAY' | 'DEPOT';

export interface Node {
    id: string;
    type: NodeType;
    name: string;
    latitude: number;
    longitude: number;
    capacity?: number;
    currentOccupancy?: number;
}

export interface Arc {
    id: number;
    originId: string;
    destinationId: string;
    distance: number;
    travelTime: number;
    penibility: number;
    weatherImpact: number;
    fuelCost: number;
    cost?: number; // Composite cost for visualization
}
