// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";

// Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface DeliveryRequest {
  // Sender
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  senderAddress: string;
  senderCity: string;
  senderRegion: string;
  senderCountry: string;
  senderLandmark?: string;

  // Recipient
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  recipientAddress: string;
  recipientCity: string;
  recipientRegion: string;
  recipientCountry: string;
  recipientLandmark?: string;

  // Package
  packageDescription: string;
  packageWeight: number;
  packageLength?: number;
  packageWidth?: number;
  packageHeight?: number;
  isFragile: boolean;
  isPerishable: boolean;
  isLiquid: boolean;
  isInsured: boolean;

  // Route
  transportMode: string;
  homePickup: boolean;
  homeDelivery: boolean;
  expressDelivery: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  specialInstructions?: string;

  // Payment
  price: number;
  paymentMethod: string;
}

export interface DeliveryResponse {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
  price: number;
}

export interface TrackingResponse {
  trackingCode: string;
  status: string;
  currentLocation?: Location;
  estimatedArrival?: string;
  history: Array<{
    status: string;
    timestamp: string;
    location?: string;
    description: string;
  }>;
  sender: {
    name: string;
    city: string;
  };
  recipient: {
    name: string;
    city: string;
  };
  packageInfo: {
    description: string;
    weight: number;
  };
}

export interface RouteRequest {
  origin: Location;
  destination: Location;
  waypoints?: Location[];
}

export interface RouteResponse {
  distance: number; // in kilometers
  duration: number; // in seconds
  eta: string;
  path: Location[];
  instructions?: string[];
}

export interface VRPRequest {
  deliveries: Array<{
    id: string;
    pickupLocation: Location;
    deliveryLocation: Location;
    priority: number;
    timeWindow?: {
      start: string;
      end: string;
    };
  }>;
  drivers: Array<{
    id: string;
    currentLocation: Location;
    vehicleCapacity: number;
  }>;
}

export interface VRPResponse {
  tours: Array<{
    driverId: string;
    deliverySequence: string[];
    totalDistance: number;
    totalDuration: number;
    estimatedCompletion: string;
  }>;
  optimizationScore: number;
}

export interface KalmanUpdateRequest {
  deliveryId: string;
  currentLocation: Location;
  timestamp: string;
  speed?: number;
}

export interface KalmanUpdateResponse {
  predictedLocation: Location;
  estimatedArrival: string;
  confidence: number;
  remainingDistance: number;
}

// API Client
class DeliveryAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // ===== DELIVERIES =====

  async createDelivery(data: DeliveryRequest): Promise<DeliveryResponse> {
    return this.request<DeliveryResponse>("/deliveries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getDelivery(id: string): Promise<any> {
    return this.request<any>(`/deliveries/${id}`, {
      method: "GET",
    });
  }

  async trackDelivery(trackingCode: string): Promise<TrackingResponse> {
    return this.request<TrackingResponse>(`/tracking/${trackingCode}`, {
      method: "GET",
    });
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: string,
    location?: Location
  ): Promise<any> {
    return this.request<any>(`/deliveries/${deliveryId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, location }),
    });
  }

  async assignDriver(deliveryId: string, driverId: string): Promise<any> {
    return this.request<any>(`/deliveries/${deliveryId}/assign`, {
      method: "POST",
      body: JSON.stringify({ driverId }),
    });
  }

  async getAllDeliveries(filters?: {
    status?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString();
    return this.request<any[]>(`/deliveries${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  }

  // ===== ROUTING =====

  async calculateRoute(data: RouteRequest): Promise<RouteResponse> {
    return this.request<RouteResponse>("/routing/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async optimizeRoute(waypoints: Location[]): Promise<RouteResponse> {
    return this.request<RouteResponse>("/routing/optimize", {
      method: "POST",
      body: JSON.stringify({ waypoints }),
    });
  }

  // ===== VRP OPTIMIZATION =====

  async optimizeVRP(data: VRPRequest): Promise<VRPResponse> {
    return this.request<VRPResponse>("/vrp/optimize", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTourOptimization(tourId: string): Promise<any> {
    return this.request<any>(`/tours/${tourId}/optimize`, {
      method: "GET",
    });
  }

  // ===== KALMAN FILTER / REAL-TIME TRACKING =====

  async updateLocationKalman(
    data: KalmanUpdateRequest
  ): Promise<KalmanUpdateResponse> {
    return this.request<KalmanUpdateResponse>("/tracking/kalman/update", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getETA(deliveryId: string): Promise<{
    eta: string;
    distance: number;
    confidence: number;
  }> {
    return this.request<any>(`/tracking/${deliveryId}/eta`, {
      method: "GET",
    });
  }

  // ===== DRIVERS =====

  async getAvailableDrivers(location?: Location): Promise<any[]> {
    const params = location
      ? `?lat=${location.latitude}&lng=${location.longitude}`
      : "";
    return this.request<any[]>(`/drivers/available${params}`, {
      method: "GET",
    });
  }

  async getDriverDeliveries(driverId: string): Promise<any[]> {
    return this.request<any[]>(`/drivers/${driverId}/deliveries`, {
      method: "GET",
    });
  }

  async updateDriverLocation(
    driverId: string,
    location: Location
  ): Promise<void> {
    return this.request<void>(`/drivers/${driverId}/location`, {
      method: "PUT",
      body: JSON.stringify(location),
    });
  }

  // ===== TOURS =====

  async getTour(tourId: string): Promise<any> {
    return this.request<any>(`/tours/${tourId}`, {
      method: "GET",
    });
  }

  async getAllTours(filters?: {
    status?: string;
    driverId?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString();
    return this.request<any[]>(`/tours${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  }

  async createTour(data: {
    driverId: string;
    deliveryIds: string[];
  }): Promise<any> {
    return this.request<any>("/tours", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ===== PETRI NET STATE TRANSITIONS =====

  async getDeliveryState(deliveryId: string): Promise<any> {
    return this.request<any>(`/petri-net/state/${deliveryId}`, {
      method: "GET",
    });
  }

  async fireTransition(
    deliveryId: string,
    transition: string
  ): Promise<any> {
    return this.request<any>(`/petri-net/fire`, {
      method: "POST",
      body: JSON.stringify({ deliveryId, transition }),
    });
  }

  // ===== GRAPH / NETWORK =====

  async getDeliveryGraph(filters?: { region?: string }): Promise<any> {
    const params = filters
      ? `?${new URLSearchParams(filters as any).toString()}`
      : "";
    return this.request<any>(`/graph${params}`, {
      method: "GET",
    });
  }

  async findShortestPath(originId: string, destinationId: string): Promise<any> {
    return this.request<any>("/graph/shortest-path", {
      method: "POST",
      body: JSON.stringify({ originId, destinationId }),
    });
  }
}

// Export singleton instance
export const api = new DeliveryAPI();

// Helper functions
export function formatETA(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km < 1) {
    return `${Math.round(meters)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(price);
}
