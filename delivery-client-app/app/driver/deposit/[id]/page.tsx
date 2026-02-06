"use client";

import { useState, useEffect } from "react";
import { MapPin, ArrowLeft, Truck, AlertCircle, CheckCircle, Navigation } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { driverAuth } from "@/lib/driverAuth";
import { getRealRoute } from "@/lib/routing";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(
  () => import("@/components/map/DeliveryMap").then((mod) => mod.DeliveryMap),
  { ssr: false }
);

interface Hub {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface DeliveryInfo {
  id: string;
  trackingCode: string;
  recipientName: string;
  recipientAddress: string;
  deliveryLocationId: string;
  packageDescription: string;
  weight: number;
}

export default function HubDepositPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeToHub, setRouteToHub] = useState<Array<[number, number]>>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);
  const [isDepositing, setIsDepositing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deliveryData, hubsData] = await Promise.all([
          api.getDeliveryDetails(deliveryId),
          api.getNodes()
        ]);

        setDelivery({
          id: deliveryData.id,
          trackingCode: deliveryData.trackingCode,
          recipientName: deliveryData.recipientName,
          recipientAddress: deliveryData.recipientAddress,
          deliveryLocationId: deliveryData.deliveryLocationId,
          packageDescription: deliveryData.packageDescription || "Colis",
          weight: deliveryData.weight || 0
        });

        // Filter only RELAY and DEPOT hubs
        const filteredHubs = hubsData
          .filter((n: any) => n.type === 'RELAY' || n.type === 'DEPOT')
          .map((n: any) => ({
            id: n.id,
            name: n.name || n.id,
            type: n.type,
            latitude: n.latitude,
            longitude: n.longitude,
            address: n.address
          }));

        setHubs(filteredHubs);

        // Get driver's current location (geolocation or last known)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setDriverLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) => {
              console.error("Geolocation error:", error);
              // Fallback to Yaoundé center
              setDriverLocation({ latitude: 3.8480, longitude: 11.5021 });
            }
          );
        } else {
          setDriverLocation({ latitude: 3.8480, longitude: 11.5021 });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Impossible de charger les données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deliveryId]);

  // Calculate route when hub is selected
  useEffect(() => {
    const calculateRoute = async () => {
      if (!selectedHub || !driverLocation) return;

      try {
        const route = await getRealRoute(
          [driverLocation.latitude, driverLocation.longitude],
          [selectedHub.latitude, selectedHub.longitude]
        );

        if (route) {
          setRouteToHub(route.coordinates);
          setRouteDistance(route.distance);
          setRouteDuration(route.duration);
        }
      } catch (error) {
        console.error("Error calculating route:", error);
      }
    };

    calculateRoute();
  }, [selectedHub, driverLocation]);

  const handleHubSelect = (hub: Hub) => {
    setSelectedHub(hub);
  };

  const handleDeposit = async () => {
    if (!selectedHub || !delivery) return;

    setIsDepositing(true);
    try {
      const driver = driverAuth.getDriver();
      if (!driver) {
        toast.error("Session expirée");
        router.push("/driver/login");
        return;
      }

      // Call backend to deposit at hub
      await api.depositAtHub(deliveryId, selectedHub.id, driverLocation || undefined);

      toast.success(`Colis déposé au hub ${selectedHub.name}!`);

      // Redirect back to dashboard
      setTimeout(() => {
        router.push("/driver/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error depositing at hub:", error);
      toast.error("Erreur lors du dépôt au hub");
    } finally {
      setIsDepositing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted">Chargement...</div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="card text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Livraison introuvable</h2>
          <Link href="/driver/dashboard" className="btn-primary mt-4">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-background-card border-b border-border sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <Link href={`/driver/deliveries/${deliveryId}`} className="p-2 hover:bg-background-light rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Déposer au Hub</h1>
              <p className="text-sm text-text-muted">{delivery.trackingCode}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 space-y-6">
        {/* Delivery Info */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">Informations du colis</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-text-muted text-sm">Destination finale</p>
                <p className="font-medium">{delivery.recipientName}</p>
                <p className="text-sm text-text-muted">{delivery.recipientAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-muted">Colis:</span>
              <span className="font-medium">{delivery.packageDescription} • {delivery.weight} kg</span>
            </div>
          </div>
        </div>

        {/* Hub Selection */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">Sélectionner un hub</h2>
          <div className="space-y-3">
            {hubs.map((hub) => (
              <button
                key={hub.id}
                onClick={() => handleHubSelect(hub)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedHub?.id === hub.id
                    ? "bg-primary/10 border-primary"
                    : "bg-background-light border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{hub.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        hub.type === 'DEPOT' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {hub.type === 'DEPOT' ? 'Dépôt' : 'Point Relais'}
                      </span>
                    </div>
                    {hub.address && (
                      <p className="text-sm text-text-muted">{hub.address}</p>
                    )}
                  </div>
                  {selectedHub?.id === hub.id && (
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map & Route */}
        {selectedHub && driverLocation && (
          <div className="card">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Itinéraire vers le hub
            </h2>

            <div className="h-[400px] rounded-xl overflow-hidden mb-4">
              <DeliveryMap
                pickupLocation={driverLocation}
                deliveryLocation={{
                  latitude: selectedHub.latitude,
                  longitude: selectedHub.longitude,
                  address: selectedHub.name
                }}
                routePoints={routeToHub}
                hubs={hubs}
                className="w-full h-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-background-light rounded-xl">
              <div>
                <p className="text-text-muted text-sm mb-1">Distance</p>
                <p className="font-bold text-lg text-primary">{routeDistance.toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-text-muted text-sm mb-1">Durée estimée</p>
                <p className="font-bold text-lg text-primary">{Math.round(routeDuration)} min</p>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Button */}
        <button
          onClick={handleDeposit}
          disabled={!selectedHub || isDepositing}
          className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDepositing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Dépôt en cours...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Confirmer le dépôt au hub
            </span>
          )}
        </button>

        {!selectedHub && (
          <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <p className="text-orange-500 text-sm">
              ⚠️ Veuillez sélectionner un hub ci-dessus
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
