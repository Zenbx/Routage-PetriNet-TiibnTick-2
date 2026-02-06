"use client";

import { useState, useEffect, Suspense } from "react";
import { Search, QrCode, Package, MapPin, Clock, User, ArrowLeft, Truck, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useRouter, useSearchParams } from "next/navigation";
import { api, formatPrice, formatDistance, type TrackingResponse } from "@/lib/api";
import { getRealRoute } from "@/lib/routing";
import Link from "next/link";
import dynamicImport from "next/dynamic";

// Dynamically import map component (client-side only)
const DeliveryMap = dynamicImport(
  () => import("@/components/map/DeliveryMap").then((mod) => mod.DeliveryMap),
  {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-background-light rounded-xl animate-pulse flex items-center justify-center text-text-muted">Chargement de la carte...</div>
  }
);

export const dynamic = 'force-dynamic';

function TrackingContent() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";

  const [trackingCode, setTrackingCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingResponse | null>(null);
  const [error, setError] = useState("");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // Auto-track si code dans URL
  useEffect(() => {
    if (codeFromUrl) {
      handleSubmit(new Event("submit") as any);
    }
  }, [codeFromUrl]);

  // WebSocket pour mises à jour en temps réel
  useEffect(() => {
    if (!trackingInfo || (trackingInfo.status === 'DELIVERED')) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/api/ws";
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log("WebSocket connected");
          // On pourrait s'abonner spécifiquement ici si le backend le supportait
        };

        socket.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);
            // Vérifier si la mise à jour concerne cette livraison
            // Note: Le backend broadcast actuellement sur /topic/fleet
            // On vérifie si l'update contient les bonnes infos
            if (update.etaMin || update.currentLatitude) {
              setTrackingInfo(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  estimatedArrival: update.etaMin || prev.estimatedArrival,
                  remainingDistance: update.remainingDistance || prev.remainingDistance,
                  driverLocation: update.currentLatitude ? {
                    latitude: update.currentLatitude,
                    longitude: update.currentLongitude,
                    address: "Position en temps réel"
                  } : prev.driverLocation,
                  progressPercentage: update.kalmanState?.distanceCovered
                    ? Math.min(100, Math.round(update.kalmanState.distanceCovered * 100))
                    : prev.progressPercentage
                };
              });
            }
          } catch (e) {
            console.error("Error parsing WS message", e);
          }
        };

        socket.onclose = () => {
          console.log("WebSocket disconnected, reconnecting...");
          reconnectTimeout = setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
          console.error("WebSocket error", err);
          socket?.close();
        };
      } catch (err) {
        console.error("Failed to connect WebSocket", err);
      }
    };

    connect();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, [trackingInfo?.trackingCode, trackingInfo?.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const data = await api.trackDelivery(trackingCode.trim());

      // Calculate real road route using OSRM if locations are available
      if (data.pickupLocation && data.deliveryLocation) {
        try {
          const osrmRoute = await getRealRoute(
            [data.pickupLocation.latitude, data.pickupLocation.longitude],
            [data.deliveryLocation.latitude, data.deliveryLocation.longitude]
          );

          if (osrmRoute && osrmRoute.coordinates.length > 0) {
            // Update tracking info with real route
            data.routePath = osrmRoute.coordinates;
            console.log("OSRM route calculated with", osrmRoute.coordinates.length, "waypoints");
          } else {
            // Fallback: straight line if OSRM fails
            console.warn("OSRM routing failed, using straight line");
            data.routePath = [
              [data.pickupLocation.latitude, data.pickupLocation.longitude],
              [data.deliveryLocation.latitude, data.deliveryLocation.longitude]
            ];
          }
        } catch (routeError) {
          console.error("Error calculating OSRM route:", routeError);
          // Continue with backend route if available
        }
      }

      setTrackingInfo(data);

      if (data.status === "PENDING" || data.status === "ACCEPTED") {
        toast.warning("Le colis n'a pas encore été récupéré par le livreur. Les informations de trajet seront disponibles après la récupération.");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setTrackingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      ACCEPTED: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      PICKED_UP: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
      IN_TRANSIT: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      DELIVERED: "bg-green-500/10 text-green-500 border-green-500/30",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500 border-gray-500/30";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "En attente",
      ACCEPTED: "Accepté",
      PICKED_UP: "Récupéré",
      IN_TRANSIT: "En transit",
      DELIVERED: "Livré",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Suivi de Colis
          </h1>
          <p className="text-text-muted text-lg">
            Entrez votre numéro de suivi pour localiser votre expédition.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-background-card border-2 border-border rounded-2xl p-4 focus-within:border-primary transition-all">
              <Search className="w-6 h-6 text-text-muted flex-shrink-0" />
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Ex: TRK-ABCD123XY"
                className="flex-1 bg-transparent text-text text-lg outline-none placeholder:text-text-muted"
                disabled={loading}
              />
              <button
                type="button"
                className="p-2 hover:bg-background-light rounded-lg transition-colors"
                title="Scanner QR Code"
              >
                <QrCode className="w-6 h-6 text-text-muted" />
              </button>
              <button
                type="submit"
                disabled={loading || !trackingCode.trim()}
                className="btn-primary px-8 disabled:opacity-50"
              >
                {loading ? "Recherche..." : "Suivre"}
              </button>
            </div>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Info */}
        {trackingInfo && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Status Card */}
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-text-muted text-sm mb-1">Code de suivi</div>
                  <div className="text-2xl font-bold text-white">
                    {trackingInfo.trackingCode}
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-full border font-bold text-sm ${getStatusColor(
                    trackingInfo.status
                  )}`}
                >
                  {getStatusLabel(trackingInfo.status)}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">Progression</span>
                  <span className="text-primary font-bold">
                    {trackingInfo.progressPercentage || 0}%
                  </span>
                </div>
                <div className="h-2 bg-background-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${trackingInfo.progressPercentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Delivery Nodes Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-background-light rounded-xl border border-border/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-text-muted text-xs uppercase tracking-wider font-bold mb-1">Point de départ</div>
                    <div className="text-white font-medium">{trackingInfo.senderName}</div>
                    <div className="text-text-muted text-sm mt-1">
                      {trackingInfo.senderAddress}
                      {(trackingInfo.senderCity || trackingInfo.senderRegion) && (
                        <span className="block italic text-xs">
                          {trackingInfo.senderCity}{trackingInfo.senderRegion ? `, ${trackingInfo.senderRegion}` : ""}{trackingInfo.senderCountry ? ` (${trackingInfo.senderCountry})` : ""}
                        </span>
                      )}
                    </div>
                    {trackingInfo.senderLandmark && (
                      <div className="text-blue-400 text-xs mt-1 font-medium bg-blue-400/5 py-1 px-2 rounded inline-block">
                        Lieu-dit: {trackingInfo.senderLandmark}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-text-muted text-xs uppercase tracking-wider font-bold mb-1">Point d'arrivée</div>
                    <div className="text-white font-medium">{trackingInfo.recipientName}</div>
                    <div className="text-text-muted text-sm mt-1">
                      {trackingInfo.recipientAddress}
                      {(trackingInfo.recipientCity || trackingInfo.recipientRegion) && (
                        <span className="block italic text-xs">
                          {trackingInfo.recipientCity}{trackingInfo.recipientRegion ? `, ${trackingInfo.recipientRegion}` : ""}{trackingInfo.recipientCountry ? ` (${trackingInfo.recipientCountry})` : ""}
                        </span>
                      )}
                    </div>
                    {trackingInfo.recipientLandmark && (
                      <div className="text-green-400 text-xs mt-1 font-medium bg-green-400/5 py-1 px-2 rounded inline-block">
                        Lieu-dit: {trackingInfo.recipientLandmark}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Package Content Info */}
              <div className="p-4 bg-background-light/50 rounded-xl border border-border/20 flex items-center gap-4">
                <Package className="w-8 h-8 text-primary opacity-50" />
                <div>
                  <div className="text-text-muted text-xs uppercase tracking-wider">Contenu du colis</div>
                  <div className="text-white font-medium">
                    {trackingInfo.packageDescription} • {trackingInfo.weight} kg
                  </div>
                </div>
              </div>

              {/* Driver Info Section */}
              {trackingInfo.driverName && (
                <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-text-muted text-xs uppercase tracking-wider font-bold mb-1">Livreur Assigné</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold text-lg">{trackingInfo.driverName}</div>
                        {trackingInfo.licensePlate && (
                          <div className="text-text-muted text-xs">Véhicule: {trackingInfo.licensePlate}</div>
                        )}
                      </div>
                      {trackingInfo.driverPhone && (
                        <a
                          href={`tel:${trackingInfo.driverPhone}`}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-bold hover:bg-purple-600 transition-colors"
                        >
                          Appeler
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Route and ETA Info */}
              {(trackingInfo.totalDistance || trackingInfo.estimatedArrival) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-background-light rounded-xl border border-border/50">
                  {trackingInfo.totalDistance && (
                    <div>
                      <div className="text-text-muted text-xs mb-1">Distance totale</div>
                      <div className="text-white font-bold text-lg">{formatDistance(trackingInfo.totalDistance * 1000)}</div>
                    </div>
                  )}
                  {trackingInfo.remainingDistance != null && (
                    <div>
                      <div className="text-text-muted text-xs mb-1">Distance restante</div>
                      <div className="text-primary font-bold text-lg">{formatDistance(trackingInfo.remainingDistance * 1000)}</div>
                    </div>
                  )}
                  {trackingInfo.estimatedArrival && (
                    <div className="col-span-2">
                      <div className="text-text-muted text-xs mb-1">Arrivée estimée</div>
                      <div className="text-green-400 font-bold text-lg">
                        {new Date(trackingInfo.estimatedArrival).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })}
                      </div>
                    </div>
                  )}
                  {trackingInfo.price != null && (
                    <div>
                      <div className="text-text-muted text-xs mb-1">Prix</div>
                      <div className="text-white font-bold text-lg">{formatPrice(trackingInfo.price)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map */}
            {(trackingInfo.pickupLocation || trackingInfo.deliveryLocation) && (
              <div className={`card ${isMapFullscreen ? 'fixed inset-0 z-50 rounded-none p-0' : ''}`}>
                <div className={`flex items-center justify-between ${isMapFullscreen ? 'p-6 bg-background-card' : 'mb-4'}`}>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Carte de suivi
                  </h3>
                  <button
                    onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {isMapFullscreen ? (
                      <>
                        <X className="w-4 h-4" />
                        Fermer
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                        </svg>
                        Plein écran
                      </>
                    )}
                  </button>
                </div>
                <div className={`w-full rounded-xl overflow-hidden ${isMapFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[400px]'}`}>
                  <DeliveryMap
                    pickupLocation={trackingInfo.pickupLocation}
                    deliveryLocation={trackingInfo.deliveryLocation}
                    driverLocation={trackingInfo.driverLocation}
                    hubs={trackingInfo.hubs}
                    routePoints={trackingInfo.routePath || []}
                    className="w-full h-full"
                  />
                </div>
                <div className={`grid grid-cols-3 gap-2 text-xs ${isMapFullscreen ? 'p-6 pt-2 bg-background-card' : 'mt-4'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-text-muted">Récupération</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-text-muted">Livraison</span>
                  </div>
                  {trackingInfo.driverLocation && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                      <span className="text-text-muted">Livreur (Temps réel)</span>
                    </div>
                  )}
                  {trackingInfo.hubs && trackingInfo.hubs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-text-muted">Point Relais</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="card">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Historique de livraison
              </h3>
              <div className="space-y-4">
                {trackingInfo.createdAt && (
                  <TimelineItem
                    title="Demande créée"
                    date={new Date(trackingInfo.createdAt).toLocaleString("fr-FR")}
                    isCompleted
                  />
                )}
                {trackingInfo.acceptedAt && (
                  <TimelineItem
                    title="Acceptée par un livreur"
                    date={new Date(trackingInfo.acceptedAt).toLocaleString("fr-FR")}
                    isCompleted
                  />
                )}
                {trackingInfo.pickedUpAt && (
                  <TimelineItem
                    title="Colis récupéré"
                    date={new Date(trackingInfo.pickedUpAt).toLocaleString("fr-FR")}
                    isCompleted
                  />
                )}
                {/* Hub events (deposits and pickups) */}
                {trackingInfo.hubEvents && trackingInfo.hubEvents
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((event, index) => (
                    <TimelineItem
                      key={`hub-event-${index}`}
                      title={
                        event.eventType === "DEPOSIT"
                          ? `Dépôt au hub ${event.hubName}`
                          : `Retrait du hub ${event.hubName}`
                      }
                      subtitle={event.hubAddress}
                      date={new Date(event.timestamp).toLocaleString("fr-FR")}
                      isCompleted
                      icon="hub"
                    />
                  ))}
                {trackingInfo.deliveredAt && (
                  <TimelineItem
                    title="Livré"
                    date={new Date(trackingInfo.deliveredAt).toLocaleString("fr-FR")}
                    isCompleted
                    isLast
                  />
                )}
                {trackingInfo.estimatedDeliveryTime && !trackingInfo.deliveredAt && (
                  <TimelineItem
                    title="Livraison estimée"
                    date={new Date(trackingInfo.estimatedDeliveryTime).toLocaleString("fr-FR")}
                    isCompleted={false}
                    isLast
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        {!trackingInfo && !error && (
          <div className="max-w-2xl mx-auto">
            <div className="card text-center py-12">
              <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Où est mon colis ?</h3>
              <p className="text-text-muted text-sm">
                Entrez votre code de suivi ci-dessus pour suivre votre expédition en temps réel.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted">Chargement...</div>
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}

function TimelineItem({
  title,
  subtitle,
  date,
  isCompleted,
  isLast = false,
  icon,
}: {
  title: string;
  subtitle?: string;
  date: string;
  isCompleted: boolean;
  isLast?: boolean;
  icon?: "hub" | "default";
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full border-2 ${
            icon === "hub"
              ? "bg-amber-500 border-amber-500"
              : isCompleted
              ? "bg-primary border-primary"
              : "bg-background border-border"
            }`}
        />
        {!isLast && (
          <div
            className={`w-0.5 h-12 ${isCompleted ? "bg-primary" : "bg-border"
              }`}
          />
        )}
      </div>
      <div className="flex-1 pb-8">
        <div className={`font-medium ${isCompleted ? "text-white" : "text-text-muted"}`}>
          {title}
        </div>
        {subtitle && (
          <div className="text-text-muted text-xs mt-0.5">{subtitle}</div>
        )}
        <div className="text-text-muted text-sm mt-1">{date}</div>
      </div>
    </div>
  );
}
