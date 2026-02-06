// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface DeliveryRequest {
  sender: {
    name: string;
    phone: string;
    address: string;
    pickupType: "HOME" | "RELAY_POINT";
    pickupLocationId: string;
  };
  recipient: {
    name: string;
    phone: string;
    address: string;
    deliveryType: "HOME" | "RELAY_POINT";
    deliveryLocationId: string;
  };
  package_: {
    description: string;
    weight: number;
    length?: number;
    width?: number;
    height?: number;
  };
  preferredDeadline?: string;
  specialInstructions?: string;
  distance?: number;
  price?: number;
}

export interface DeliveryResponse {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
  price: number;
  distance?: number;
}

// Tracking response from backend
export interface TrackingResponse {
  trackingCode: string;
  status: string;
  createdAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  driverName?: string;
  driverPhone?: string;
  licensePlate?: string;
  senderName: string;
  senderAddress: string;
  senderLandmark?: string;
  senderCity?: string;
  senderRegion?: string;
  senderCountry?: string;
  recipientName: string;
  recipientAddress: string;
  recipientLandmark?: string;
  recipientCity?: string;
  recipientRegion?: string;
  recipientCountry?: string;
  estimatedDeliveryTime?: string;
  progressPercentage?: number;
  pickupLocation?: Location;
  deliveryLocation?: Location;
  driverLocation?: Location;
  hubs?: Location[];
  packageDescription: string;
  weight: number;
  // Route and ETA data
  routePath?: Array<[number, number]>; // [[lat, lng], ...]
  totalDistance?: number; // km
  remainingDistance?: number; // km
  estimatedArrival?: string; // ISO 8601 timestamp
  price?: number;
  // Hub deposit/pickup events
  hubEvents?: HubEvent[];
}

export interface HubEvent {
  eventType: "DEPOSIT" | "PICKUP";
  timestamp: string;
  hubId: string;
  hubName: string;
  hubAddress?: string;
  driverName?: string;
  deliveryId?: string;
  notes?: string;
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
    return this.request<DeliveryResponse>("/v1/client/delivery/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getDelivery(id: string): Promise<any> {
    return this.request<any>(`/v1/delivery/${id}`, {
      method: "GET",
    });
  }

  async getDeliveryFeed(): Promise<any[]> {
    return this.request<any[]>("/v1/delivery-driver/feed", {
      method: "GET",
    });
  }

  async getDeliveryDetails(id: string): Promise<any> {
    return this.request<any>(`/v1/delivery-driver/delivery/${id}/details`, {
      method: "GET",
    });
  }

  async trackDelivery(trackingCode: string): Promise<TrackingResponse> {
    return this.request<TrackingResponse>(`/v1/client/tracking/${trackingCode}`, {
      method: "GET",
    });
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: string,
    location?: Location
  ): Promise<any> {
    return this.request<any>(`/v1/delivery/${deliveryId}/state-transition`, {
      method: "POST",
      body: JSON.stringify({ event: status, location }),
    });
  }

  async assignDriver(deliveryId: string, driverId: string): Promise<any> {
    return this.request<any>(`/v1/delivery-driver/delivery/${deliveryId}/accept?driverId=${driverId}`, {
      method: "POST",
    });
  }

  async depositAtHub(
    deliveryId: string,
    hubId: string,
    currentLocation?: { latitude: number; longitude: number }
  ): Promise<any> {
    return this.request<any>(`/v1/delivery/${deliveryId}/deposit-at-hub`, {
      method: "POST",
      body: JSON.stringify({
        hubId,
        currentLocation
      }),
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
    return this.request<any[]>(`/v1/delivery${query ? `?${query}` : ""}`, {
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
    return this.request<any[]>(`/v1/delivery-driver/deliveries?driverId=${driverId}`, {
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

  // ===== HUB MANAGEMENT =====

  async getNearbyHubs(lat: number, lng: number, radiusKm: number = 10): Promise<any[]> {
    return this.request<any[]>(`/v1/hub/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`, {
      method: "GET",
    });
  }

  async getHubDeposits(hubId: string, status?: string): Promise<any[]> {
    const url = status
      ? `/v1/hub/${hubId}/deposits?status=${status}`
      : `/v1/hub/${hubId}/deposits`;
    return this.request<any[]>(url, {
      method: "GET",
    });
  }

  async getDepositByDeliveryId(deliveryId: string): Promise<any> {
    return this.request<any>(`/v1/hub/deposit/delivery/${deliveryId}`, {
      method: "GET",
    });
  }

  async checkParcelAtHub(trackingCode: string): Promise<any> {
    return this.request<any>(`/v1/hub/check/${trackingCode}`, {
      method: "GET",
    });
  }

  async pickupFromHub(request: {
    trackingCode: string;
    pickupPhone: string;
    pickupName: string;
    pickupProof?: string;
    hubId?: string;
  }): Promise<any> {
    return this.request<any>("/hub/pickup", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // ===== NOTIFICATIONS =====

  async getNotificationsByTrackingCode(trackingCode: string): Promise<any[]> {
    return this.request<any[]>(`/v1/notifications/tracking/${trackingCode}`, {
      method: "GET",
    });
  }

  async getUnreadNotifications(phone: string): Promise<any[]> {
    return this.request<any[]>(`/v1/notifications/unread?phone=${encodeURIComponent(phone)}`, {
      method: "GET",
    });
  }

  async countUnreadNotifications(phone: string): Promise<number> {
    return this.request<number>(`/v1/notifications/unread/count?phone=${encodeURIComponent(phone)}`, {
      method: "GET",
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    return this.request<any>(`/v1/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead(phone: string): Promise<void> {
    return this.request<void>(`/v1/notifications/read-all?phone=${encodeURIComponent(phone)}`, {
      method: "PUT",
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

  async getArcs(): Promise<any[]> {
    return this.request<any[]>("/v1/graph/arcs", { method: "GET" });
  }

  async getNodes(): Promise<any[]> {
    return this.request<any[]>("/v1/graph/nodes", { method: "GET" });
  }

  async getHubs(): Promise<any[]> {
    const nodes = await this.getNodes();
    return nodes.filter(n => n.type === 'RELAY' || n.type === 'DEPOT');
  }

  async findShortestPath(originId: string, destinationId: string, driverId?: string): Promise<any> {
    return this.request<any>("/v1/routing/shortest-path", {
      method: "POST",
      body: JSON.stringify({
        origin: originId,
        destination: destinationId,
        driverId: driverId,
        costWeights: {
          alpha: 1.0,
          beta: 1.5, // Poids plus élevé pour le temps
          gamma: 1.0, // Pénibilité
          delta: 1.2, // Météo
          eta: 1.0    // Carburant
        }
      }),
    });
  }

  async updateTraffic(arcId: number, trafficFactor: number): Promise<void> {
    return this.request<void>(`/v1/routing/arcs/${arcId}/traffic`, {
      method: "POST",
      body: JSON.stringify({ trafficFactor }),
    });
  }

  async updateWeather(arcId: number, weatherImpact: number): Promise<void> {
    return this.request<void>(`/v1/routing/arcs/${arcId}/weather`, {
      method: "POST",
      body: JSON.stringify({ weatherImpact }),
    });
  }

  async updateVehicleSettings(driverId: string, settings: { averageSpeed?: number, fuelConsumption?: number }): Promise<void> {
    return this.request<void>(`/v1/routing/driver/${driverId}/vehicle-settings`, {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async findNodeByName(name: string): Promise<any> {
    return this.request<any>(`/v1/graph/nodes/search?name=${encodeURIComponent(name)}`, {
      method: "GET",
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
