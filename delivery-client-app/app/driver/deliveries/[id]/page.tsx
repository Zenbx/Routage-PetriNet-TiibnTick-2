"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Package,
  Clock,
  DollarSign,
  Navigation,
  CheckCircle,
  AlertCircle,
  Camera,
  FileText,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { driverAuth } from "@/lib/driverAuth";
import { getRealRoute } from "@/lib/routing";
import dynamic from "next/dynamic";

// Dynamically import map component (client-side only)
const DeliveryMap = dynamic(
  () => import("@/components/map/DeliveryMap").then((mod) => mod.DeliveryMap),
  { ssr: false }
);

// Types
interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface DeliveryDetails {
  id: string;
  trackingCode: string;
  status: "ACCEPTED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED";
  createdAt: string;

  // Sender
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderRegion: string;
  senderLandmark: string;
  pickupLocation?: Location;

  // Recipient
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientRegion: string;
  recipientLandmark: string;
  deliveryLocation?: Location;

  // Package
  packageDescription: string;
  packageWeight: number;
  packageDimensions: string;
  isFragile: boolean;
  isPerishable: boolean;
  isInsured: boolean;

  // Route
  distance: number;
  estimatedDuration: string;
  price: number;
}

export default function DeliveryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<"ACCEPTED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED">("ACCEPTED");
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [hubs, setHubs] = useState<any[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<Array<[number, number]>>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [driverSettings, setDriverSettings] = useState({ averageSpeed: 40, fuelConsumption: 8 });
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt" | "unsupported">("prompt");

  // Real-time GPS tracking when IN_TRANSIT
  useEffect(() => {
    if (currentStatus !== "IN_TRANSIT" && currentStatus !== "PICKED_UP") {
      setIsTrackingLocation(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationPermission("unsupported");
      console.error("Geolocation is not supported by this browser");
      return;
    }

    setIsTrackingLocation(true);
    let watchId: number;

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocationPermission("granted");
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setDriverLocation(location);

        // Send location update to backend every position change
        api.updateDeliveryStatus(deliveryId, currentStatus, location)
          .catch(err => console.error("Failed to update driver location:", err));
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission("denied");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [currentStatus, deliveryId]);

  // Fetch delivery details and hubs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, allNodes] = await Promise.all([
          api.getDeliveryDetails(deliveryId),
          api.getNodes()
        ]);

        // Filter hubs
        setHubs(allNodes.filter(n => n.type === 'RELAY' || n.type === 'DEPOT'));

        // Map API response to DeliveryDetails
        const mappedDelivery: DeliveryDetails = {
          id: data.id,
          trackingCode: data.trackingCode,
          status: data.status as any,
          createdAt: new Date(data.createdAt).toLocaleString(),

          senderName: data.senderName,
          senderPhone: data.senderPhone,
          senderAddress: data.senderAddress,
          senderCity: data.senderAddress?.split(',').pop()?.trim() || "",
          senderRegion: "",
          senderLandmark: data.senderLandmark || "",
          pickupLocation: data.pickupLocation,

          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          recipientAddress: data.recipientAddress,
          recipientCity: data.recipientAddress?.split(',').pop()?.trim() || "",
          recipientRegion: "",
          recipientLandmark: data.recipientLandmark || "",
          deliveryLocation: data.deliveryLocation,

          packageDescription: data.packageDescription || "Colis",
          packageWeight: data.weight || 0,
          packageDimensions: data.packageLength && data.packageWidth && data.packageHeight
            ? `${data.packageLength}x${data.packageWidth}x${data.packageHeight} cm`
            : "N/A",
          isFragile: data.packageDescription?.includes("Fragile") || false,
          isPerishable: data.packageDescription?.includes("Périssable") || false,
          isInsured: true,

          distance: data.distance || 0,
          estimatedDuration: "N/A",
          price: data.price || 0,
        };

        setDelivery(mappedDelivery);
        setCurrentStatus(mappedDelivery.status);

        // Calculate route using OSRM for real road routing
        if (data.pickupLocation && data.deliveryLocation) {
          try {
            // Use OSRM to get real road route
            const osrmRoute = await getRealRoute(
              [data.pickupLocation.latitude, data.pickupLocation.longitude],
              [data.deliveryLocation.latitude, data.deliveryLocation.longitude]
            );

            if (osrmRoute && osrmRoute.coordinates.length > 0) {
              console.log("Using OSRM real road route with", osrmRoute.coordinates.length, "waypoints");
              setRouteGeometry(osrmRoute.coordinates);
              setDelivery(prev => prev ? {
                ...prev,
                distance: osrmRoute.distance,
                estimatedDuration: `${Math.round(osrmRoute.duration)} min`
              } : null);
            } else {
              // Fallback: straight line if OSRM fails
              console.warn("OSRM routing failed, using straight line");
              setRouteGeometry([
                [data.pickupLocation.latitude, data.pickupLocation.longitude],
                [data.deliveryLocation.latitude, data.deliveryLocation.longitude]
              ]);
            }
          } catch (error) {
            console.error("Error calculating route:", error);
            // Fallback: straight line
            setRouteGeometry([
              [data.pickupLocation.latitude, data.pickupLocation.longitude],
              [data.deliveryLocation.latitude, data.deliveryLocation.longitude]
            ]);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la livraison:", error);
        // alert("Impossible de charger les détails de la livraison");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deliveryId]);

  const handleStatusUpdate = async (newStatus: typeof currentStatus) => {
    if (newStatus === "DELIVERED") {
      setShowProofUpload(true);
    } else {
      try {
        await api.updateDeliveryStatus(deliveryId, newStatus);
        setCurrentStatus(newStatus);

        // Le GPS tracking démarre automatiquement via useEffect quand IN_TRANSIT
        if (newStatus === "IN_TRANSIT") {
          console.log("GPS tracking will start automatically");
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        alert("Impossible de mettre à jour le statut");
      }
    }
  };

  const handleDeliveryComplete = async () => {
    try {
      await api.updateDeliveryStatus(deliveryId, "DELIVERED");
      setCurrentStatus("DELIVERED");
      setTimeout(() => {
        router.push("/driver/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de la finalisation:", error);
      alert("Impossible de finaliser la livraison");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-text-muted">Livraison introuvable</p>
          <Link href="/driver/dashboard" className="btn-primary mt-4 inline-block">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const toggleNavigation = () => {
    setIsNavigating(!isNavigating);
    // Au lieu d'ouvrir Google Maps, on active le mode navigation interne
    if (!isNavigating) {
      // On pourrait scroller vers la carte
      document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-background-card border-b border-border sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/driver/dashboard"
              className="w-10 h-10 rounded-full bg-background-light flex items-center justify-center hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-xl">{delivery.trackingCode}</h1>
              <p className="text-sm text-text-muted">Détails de la livraison</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">
        {/* Status Card */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">Statut de la livraison</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatusButton
              label="Acceptée"
              active={currentStatus === "ACCEPTED"}
              completed={["PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(currentStatus)}
              onClick={() => handleStatusUpdate("ACCEPTED")}
              disabled={currentStatus !== "ACCEPTED"}
            />
            <StatusButton
              label="Récupérée"
              active={currentStatus === "PICKED_UP"}
              completed={["IN_TRANSIT", "DELIVERED"].includes(currentStatus)}
              onClick={() => handleStatusUpdate("PICKED_UP")}
              disabled={currentStatus !== "ACCEPTED" && currentStatus !== "PICKED_UP"}
            />
            <StatusButton
              label="En transit"
              active={currentStatus === "IN_TRANSIT"}
              completed={currentStatus === "DELIVERED"}
              onClick={() => handleStatusUpdate("IN_TRANSIT")}
              disabled={!["PICKED_UP", "IN_TRANSIT"].includes(currentStatus)}
            />
            <StatusButton
              label="Livrée"
              active={currentStatus === "DELIVERED"}
              completed={false}
              onClick={() => handleStatusUpdate("DELIVERED")}
              disabled={currentStatus !== "IN_TRANSIT"}
            />
          </div>
        </div>

        {/* Location Permission Alert */}
        {(currentStatus === "IN_TRANSIT" || currentStatus === "PICKED_UP") && (
          <>
            {locationPermission === "denied" && (
              <div className="card bg-red-500/10 border-red-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-red-500 mb-2">Localisation refusée</h3>
                    <p className="text-sm text-text-muted mb-3">
                      Pour que le client puisse suivre votre position en temps réel, vous devez activer la localisation.
                    </p>
                    <p className="text-xs text-text-muted">
                      Veuillez autoriser l'accès à la localisation dans les paramètres de votre navigateur, puis rechargez la page.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {locationPermission === "granted" && isTrackingLocation && (
              <div className="card bg-green-500/10 border-green-500/30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Navigation className="w-6 h-6 text-green-500" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-green-500">Suivi GPS actif</h3>
                    <p className="text-xs text-text-muted">
                      Votre position est partagée en temps réel avec le client
                    </p>
                  </div>
                </div>
              </div>
            )}
            {locationPermission === "unsupported" && (
              <div className="card bg-orange-500/10 border-orange-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-orange-500 mb-1">Géolocalisation non supportée</h3>
                    <p className="text-sm text-text-muted">
                      Votre navigateur ne supporte pas la géolocalisation. Veuillez utiliser un navigateur moderne.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Map Section */}
        <div className={isFullScreen ? "fixed inset-0 z-[100] m-0 p-0 overflow-hidden bg-black" : "card overflow-hidden"} id="map-section">
          {/* Header & Controls Overlay (Only shown when not full screen or as floaters) */}
          {!isFullScreen && (
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="font-bold text-lg flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5 text-primary" />
                Carte de navigation
              </h2>

              <div className="flex items-center gap-4">
                {isNavigating && (
                  <div className="flex gap-4 animate-in fade-in slide-in-from-top-2 bg-background/80 backdrop-blur-md px-3 py-1 rounded-lg border border-border shadow-sm">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase text-text-muted">Reste</span>
                      <span className="font-bold text-orange-500">{delivery.distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase text-text-muted">ETA</span>
                      <span className="font-bold text-orange-500">{delivery.estimatedDuration}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={toggleFullScreen}
                  className="p-2 rounded-lg bg-background-light hover:bg-primary/10 transition-colors"
                  title="Plein écran"
                >
                  <Truck className="w-5 h-5 text-primary" />
                </button>
              </div>
            </div>
          )}

          <div className={`${isFullScreen ? "h-screen w-screen" : isNavigating ? "h-[500px]" : "h-[300px]"} relative transition-all duration-500`}>
            {/* Transparent Floating Overlays (Full Screen) */}
            {isFullScreen && (
              <>
                {/* Back / Close Button */}
                <button
                  onClick={toggleFullScreen}
                  className="absolute top-6 left-6 z-[1000] p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 transition-all shadow-xl"
                  title="Quitter le plein écran"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Floating Info Bar (Glassmorphism) */}
                {(isNavigating || true) && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-8 px-8 py-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Distance restante</span>
                      <span className="text-2xl font-black text-orange-500">{delivery.distance.toFixed(1)} <span className="text-sm font-normal text-white/40">km</span></span>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Temps estimé (ETA)</span>
                      <span className="text-2xl font-black text-orange-500">{delivery.estimatedDuration}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Legend Overlay */}
                <div className="absolute bottom-6 left-6 z-[1000] bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-2xl space-y-3 min-w-[200px]">
                  <p className="font-bold text-xs text-white pb-2 border-b border-white/10">LÉGENDE NAVIGATION</p>
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    <span>Départ</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <span>Destination</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    <span>Points Relais</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <div className="w-5 h-1 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                    <span>Fils d'itinéraire</span>
                  </div>
                </div>

                {/* Status Badge in Full Screen */}
                <div className="absolute top-6 right-6 z-[1000] px-4 py-2 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/40 text-orange-500 font-bold text-xs flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  NAVIGATION ACTIVE
                </div>
              </>
            )}

            <DeliveryMap
              pickupLocation={delivery.pickupLocation}
              deliveryLocation={delivery.deliveryLocation}
              hubs={hubs}
              routePoints={routeGeometry}
              className="w-full h-full"
            />
          </div>

          {!isFullScreen && (
            <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-text-muted">Départ</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-text-muted">Arrivée</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => alert("Signaler Trafic (Arc ID: ...) ")}
                  className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] rounded border border-red-500/20 hover:bg-red-500/20 transition-all font-bold"
                >
                  ⚠ SIGNALER TRAFIC
                </button>
                <button
                  onClick={() => alert("Signaler Météo (Arc ID: ...) ")}
                  className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[10px] rounded border border-blue-500/20 hover:bg-blue-500/20 transition-all font-bold"
                >
                  🌧 SIGNALER MÉTÉO
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Button */}
        <button
          onClick={toggleNavigation}
          className={`w-full flex items-center justify-center gap-2 text-lg py-4 rounded-xl font-bold transition-all ${isNavigating
            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]"
            : "bg-primary text-white hover:bg-primary-light"
            }`}
        >
          <Navigation className={`w-6 h-6 ${isNavigating ? "animate-pulse" : ""}`} />
          {isNavigating ? "Navigation active (Orange)" : "Lancer la Navigation In-App"}
        </button>

        {/* Deposit at Hub Button - visible when package is picked up */}
        {(currentStatus === "PICKED_UP" || currentStatus === "IN_TRANSIT") && (
          <Link
            href={`/driver/deposit/${deliveryId}`}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-lg py-4 border-2 border-primary/50 hover:border-primary hover:bg-primary/10 transition-all"
          >
            <MapPin className="w-6 h-6" />
            Déposer au Hub
          </Link>
        )}

        {/* Route Summary */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">Itinéraire</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Point de départ</p>
                <p className="text-sm text-text">{delivery.senderAddress}</p>
                {delivery.senderLandmark && (
                  <p className="text-xs text-blue-400 mt-1">📍 Lieu-dit: {delivery.senderLandmark}</p>
                )}
                {delivery.pickupLocation && (
                  <p className="text-xs text-text-muted mt-1 font-mono">
                    GPS: {delivery.pickupLocation.latitude.toFixed(6)}, {delivery.pickupLocation.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <div className="ml-4 border-l-2 border-dashed border-border h-8"></div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Destination</p>
                <p className="text-sm text-text">{delivery.recipientAddress}</p>
                {delivery.recipientLandmark && (
                  <p className="text-xs text-green-400 mt-1">📍 Lieu-dit: {delivery.recipientLandmark}</p>
                )}
                {delivery.deliveryLocation && (
                  <p className="text-xs text-text-muted mt-1 font-mono">
                    GPS: {delivery.deliveryLocation.latitude.toFixed(6)}, {delivery.deliveryLocation.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-sm text-text-muted mb-1">Distance</p>
              <p className="font-bold">{delivery.distance} km</p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Durée estimée</p>
              <p className="font-bold">{delivery.estimatedDuration}</p>
            </div>
          </div>
        </div>

        {/* Sender Details */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Expéditeur
          </h2>
          <div className="space-y-3">
            <InfoRow label="Nom" value={delivery.senderName} />
            <InfoRow
              label="Téléphone"
              value={delivery.senderPhone}
              icon={<Phone className="w-4 h-4" />}
              actionLabel="Appeler"
              actionHref={`tel:${delivery.senderPhone}`}
            />
            <InfoRow label="Adresse" value={delivery.senderAddress} />
            <InfoRow label="Lieu-dit" value={delivery.senderLandmark} />
          </div>
        </div>

        {/* Recipient Details */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Destinataire
          </h2>
          <div className="space-y-3">
            <InfoRow label="Nom" value={delivery.recipientName} />
            <InfoRow
              label="Téléphone"
              value={delivery.recipientPhone}
              icon={<Phone className="w-4 h-4" />}
              actionLabel="Appeler"
              actionHref={`tel:${delivery.recipientPhone}`}
            />
            <InfoRow label="Adresse" value={delivery.recipientAddress} />
            <InfoRow label="Lieu-dit" value={delivery.recipientLandmark} />
          </div>
        </div>

        {/* Package Details */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Informations du colis
          </h2>
          <div className="space-y-3">
            <InfoRow label="Description" value={delivery.packageDescription} />
            <InfoRow label="Poids" value={`${delivery.packageWeight} kg`} />
            <InfoRow label="Dimensions" value={delivery.packageDimensions} />

            <div className="flex flex-wrap gap-2 pt-2">
              {delivery.isFragile && (
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Fragile
                </span>
              )}
              {delivery.isPerishable && (
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Périssable
                </span>
              )}
              {delivery.isInsured && (
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Assuré
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Driver Vehicle Profile */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Profil Véhicule
            </h2>
            <button className="text-xs text-primary font-bold hover:underline">Modifier</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background-light p-3 rounded-xl">
              <p className="text-[10px] text-text-muted uppercase mb-1">Vitesse Moyenne</p>
              <p className="font-bold text-lg">{driverSettings.averageSpeed} <span className="text-xs font-normal">km/h</span></p>
            </div>
            <div className="bg-background-light p-3 rounded-xl">
              <p className="text-[10px] text-text-muted uppercase mb-1">Consommation</p>
              <p className="font-bold text-lg">{driverSettings.fuelConsumption} <span className="text-xs font-normal">L/100</span></p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-text-muted italic">
            Ces paramètres sont utilisés pour calculer votre ETA et vos coûts de carburant personnalisés.
          </p>
        </div>

        {/* Payment Details */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Paiement
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Votre gain</span>
            <span className="text-2xl font-bold text-primary">
              {delivery.price.toLocaleString()} FCFA
            </span>
          </div>
        </div>
      </div>

      {/* Proof Upload Modal */}
      {showProofUpload && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="font-bold text-xl mb-4">Preuve de livraison</h2>
            <p className="text-text-muted mb-6 text-sm">
              Veuillez fournir une preuve de livraison (photo du colis livré ou signature)
            </p>

            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Camera className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Prendre une photo</p>
                <p className="text-xs text-text-muted">ou télécharger depuis la galerie</p>
              </div>

              {/* Signature */}
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Signature du destinataire</p>
                <p className="text-xs text-text-muted">Capturer la signature</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowProofUpload(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeliveryComplete}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Components
function StatusButton({
  label,
  active,
  completed,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  completed: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${completed
        ? "bg-green-500 text-white"
        : active
          ? "bg-primary text-white"
          : "bg-background-light text-text-muted hover:bg-background-card"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {completed && <CheckCircle className="w-4 h-4 inline mr-1" />}
      {label}
    </button>
  );
}

function InfoRow({
  label,
  value,
  icon,
  actionLabel,
  actionHref,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm text-text-muted mb-1">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="btn-secondary text-sm flex items-center gap-2 flex-shrink-0"
        >
          {icon}
          {actionLabel}
        </a>
      )}
    </div>
  );
}
