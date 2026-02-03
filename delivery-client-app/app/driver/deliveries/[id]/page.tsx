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

// Types
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

  // Recipient
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientRegion: string;
  recipientLandmark: string;

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

  // Fetch delivery details
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const data = await api.getDelivery(deliveryId);

        // Map API response to DeliveryDetails
        const mappedDelivery: DeliveryDetails = {
          id: data.id,
          trackingCode: data.trackingCode,
          status: data.status as any,
          createdAt: new Date(data.createdAt).toLocaleString(),

          senderName: data.senderName,
          senderPhone: data.senderPhone,
          senderAddress: data.senderAddress,
          senderCity: data.senderCity,
          senderRegion: data.senderRegion,
          senderLandmark: data.senderLandmark || "",

          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          recipientAddress: data.recipientAddress,
          recipientCity: data.recipientCity,
          recipientRegion: data.recipientRegion,
          recipientLandmark: data.recipientLandmark || "",

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

    fetchDelivery();
  }, [deliveryId]);

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

  const openNavigation = () => {
    const destination = `${delivery.recipientAddress}, ${delivery.recipientCity}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, "_blank");
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
              disabled={currentStatus === "ACCEPTED"}
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

        {/* Navigation Button */}
        <button
          onClick={openNavigation}
          className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
        >
          <Navigation className="w-6 h-6" />
          Ouvrir la navigation
        </button>

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
      className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
        completed
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
