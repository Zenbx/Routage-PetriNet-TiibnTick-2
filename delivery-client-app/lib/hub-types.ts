
export interface HubInfo {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    capacity: number;
    currentOccupancy: number;
    availableSpace: number;
    distanceKm: number;
    isAvailable: boolean;
}

export interface HubDepositRequest {
    deliveryId: string;
    hubNodeId: string;
    driverId: string;
    notes?: string;
    storageLocation?: string;
    depositProof?: string;
}

export interface HubDepositResponse {
    depositId: string;
    deliveryId: string;
    trackingCode: string;
    hubNodeId: string;
    hubName: string;
    hubAddress: string;
    status: "DEPOSITED" | "AWAITING_PICKUP" | "PICKED_UP" | "EXPIRED" | "LOST";
    depositTime: string;
    storageLocation?: string;
    message: string;
}
