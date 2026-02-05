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
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
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
          senderLandmark: "",
          pickupLocation: data.pickupLocation,

          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          recipientAddress: data.recipientAddress,
          recipientCity: data.recipientAddress?.split(',').pop()?.trim() || "",
          recipientRegion: "",
          recipientLandmark: "",
          deliveryLocation: data.deliveryLocation,

          packageDescription: data.packageDescription || "Colis",
          packageWeight: data.weight || 0,
          packageDimensions: data.packageLength && data.packageWidth && data.packageHeight
            ? `${data.packageLength}x${data.packageWidth}x${data.packageHeight} cm`
            : "N/A",
          isFragile: data.packageDescription?.includes("Fragile") || false,
          isPerishable: data.packageDescription?.includes("Périssable") || false,
          isInsured: true,

          distance: 0,
          estimatedDuration: "N/A",
          price: data.price || 0,
        };

        setDelivery(mappedDelivery);
        setCurrentStatus(mappedDelivery.status);
      } catch (error) {
        console.error("Erreur lors de la récupération de la livraison:", error);
        alert("Impossible de charger les détails de la livraison");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deliveryId]);

  // Effect to calculate real route geometry if needed
  useEffect(() => {
    const calculateRoute = async () => {
      if (!delivery?.pickupLocation || !delivery?.deliveryLocation) return;

      try {
        // En mode réel, on chercherait les nodes les plus proches
        // ici on simule ou on utilise les IDs si disponibles
        const originNode = await api.findNodeByName(delivery.senderCity);
        const destNode = await api.findNodeByName(delivery.recipientCity);

        if (originNode && destNode) {
          const result = await api.findShortestPath(originNode.id, destNode.id);
          if (result && result.path) {
            // Transformer le path du backend en points de carte
            // Le backend retourne des Node objects dans le path
            const points: Array<[number, number]> = result.path.map((node: any) =>
              [node.latitude, node.longitude] as [number, number]
            );
            setRouteGeometry(points);

            // Mettre à jour les infos de trajet
            if (delivery) {
              setDelivery({
                ...delivery,
                distance: result.distance,
                estimatedDuration: `${Math.round(result.estimatedTime)} min`
              });
            }
          }
        }
      } catch (err) {
        console.error("Erreur calcul itinéraire:", err);
      }
    };

    if (delivery && !loading) {
      calculateRoute();
    }
  }, [delivery?.id, loading]);

  const handleStatusUpdate = async (newStatus: typeof currentStatus) => {
    if (newStatus === "DELIVERED") {
      setShowProofUpload(true);
    } else {
      try {
        await api.updateDeliveryStatus(deliveryId, newStatus);
        setCurrentStatus(newStatus);

        // Si passage en IN_TRANSIT, on pourrait démarrer le GPS tracking ici
        if (newStatus === "IN_TRANSIT") {
          // TODO: Démarrer le tracking GPS avec Kalman filter
          console.log("GPS tracking started");
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

        {/* Map */}
        <div className="card" id="map-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Carte de navigation
            </h2>
            {isNavigating && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase text-text-muted">Distance</span>
                  <span className="font-bold text-orange-500">{delivery.distance.toFixed(1)} km</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase text-text-muted">ETA</span>
                  <span className="font-bold text-orange-500">{delivery.estimatedDuration}</span>
                </div>
              </div>
            )}
          </div>
          <DeliveryMap
            pickupLocation={delivery.pickupLocation}
            deliveryLocation={delivery.deliveryLocation}
            hubs={hubs}
            routePoints={routeGeometry}
            className={`transition-all duration-500 ${isNavigating ? "h-[500px]" : "h-[300px]"}`}
          />
          <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-text-muted">Départ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-text-muted">Arrivée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-text-muted">Point Relais</span>
            </div>
          </div>
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
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Point de départ</p>
                <p className="text-sm text-text-muted">{delivery.senderCity}, {delivery.senderRegion}</p>
              </div>
            </div>

            <div className="ml-4 border-l-2 border-dashed border-border h-8"></div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Destination</p>
                <p className="text-sm text-text-muted">{delivery.recipientCity}, {delivery.recipientRegion}</p>
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
