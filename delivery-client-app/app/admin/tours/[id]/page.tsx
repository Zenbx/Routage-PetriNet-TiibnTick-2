"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Package,
  Clock,
  Navigation,
  Truck,
  User,
  Phone,
  CheckCircle,
  Circle,
  AlertCircle,
  RefreshCw,
  Route,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Types
interface Delivery {
  id: string;
  trackingCode: string;
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientPhone: string;
  status: "PENDING" | "IN_PROGRESS" | "DELIVERED";
  eta: string;
  sequence: number;
  estimatedArrival: string;
}

interface TourDetails {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  vehiclePlate: string;
  startTime: string;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveries: Delivery[];
  totalDistance: number;
  distanceCovered: number;
  averageSpeed: number;
  estimatedCompletion: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
}

export default function TourDetailsPage() {
  const params = useParams();
  const tourId = params.id as string;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data - À remplacer par appel API WebSocket pour temps réel
  const tour: TourDetails = {
    id: tourId,
    driverName: "Jean Dupont",
    driverPhone: "+237 699 12 34 56",
    vehicleType: "Camion",
    vehiclePlate: "LT-1234-CM",
    startTime: "08:30",
    currentLocation: {
      lat: 3.848,
      lng: 11.502,
      address: "Yaoundé, Melen, Rue 1.234",
    },
    deliveries: [
      {
        id: "D001",
        trackingCode: "TRK-ABC123",
        recipientName: "Paul Njiki",
        recipientAddress: "Quartier Bastos, Rue principale",
        recipientCity: "Yaoundé",
        recipientPhone: "+237 677 98 76 54",
        status: "DELIVERED",
        eta: "-",
        sequence: 1,
        estimatedArrival: "09:15",
      },
      {
        id: "D002",
        trackingCode: "TRK-DEF456",
        recipientName: "Marie Kamga",
        recipientAddress: "Carrefour Nlongkak, près du marché",
        recipientCity: "Yaoundé",
        recipientPhone: "+237 655 11 22 33",
        status: "IN_PROGRESS",
        eta: "8 min",
        sequence: 2,
        estimatedArrival: "10:30",
      },
      {
        id: "D003",
        trackingCode: "TRK-GHI789",
        recipientName: "Alice Nkomo",
        recipientAddress: "Essos, Face église",
        recipientCity: "Yaoundé",
        recipientPhone: "+237 688 44 55 66",
        status: "PENDING",
        eta: "35 min",
        sequence: 3,
        estimatedArrival: "11:15",
      },
      {
        id: "D004",
        trackingCode: "TRK-JKL012",
        recipientName: "Joseph Mballa",
        recipientAddress: "Biyem-Assi, Carrefour",
        recipientCity: "Yaoundé",
        recipientPhone: "+237 699 77 88 99",
        status: "PENDING",
        eta: "1h 05min",
        sequence: 4,
        estimatedArrival: "12:00",
      },
    ],
    totalDistance: 45.2,
    distanceCovered: 18.5,
    averageSpeed: 28.5,
    estimatedCompletion: "13:30",
    status: "ACTIVE",
  };

  const completedCount = tour.deliveries.filter((d) => d.status === "DELIVERED").length;
  const progress = (completedCount / tour.deliveries.length) * 100;

  const handleRefresh = () => {
    setIsRefreshing(true);
    // TODO: Appel API pour rafraîchir les données en temps réel
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto-refresh every 10 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-background-card border-b border-border sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="w-10 h-10 rounded-full bg-background-light flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-bold text-xl">Tournée {tour.id}</h1>
                <p className="text-sm text-text-muted">
                  Suivi en temps réel • {tour.driverName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  autoRefresh
                    ? "bg-green-500/10 text-green-500"
                    : "bg-background-light text-text-muted"
                }`}
              >
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-10 h-10 rounded-full bg-background-light flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">
        {/* Status Banner */}
        <div className="card bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Tournée en cours</span>
            </div>
            <div className="text-sm text-text-muted">
              Début: {tour.startTime} • Fin prévue: {tour.estimatedCompletion}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Package className="w-5 h-5" />}
            label="Livraisons"
            value={`${completedCount}/${tour.deliveries.length}`}
            color="text-primary"
          />
          <StatCard
            icon={<Route className="w-5 h-5" />}
            label="Distance"
            value={`${tour.distanceCovered}/${tour.totalDistance} km`}
            color="text-blue-500"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Vitesse moy."
            value={`${tour.averageSpeed} km/h`}
            color="text-green-500"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Fin prévue"
            value={tour.estimatedCompletion}
            color="text-yellow-500"
          />
        </div>

        {/* Progress Bar */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Progression de la tournée</h3>
            <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-background-light rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Map */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Carte de la tournée</h2>
            <div className="flex items-center gap-2 text-sm text-green-500">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Position en direct</span>
            </div>
          </div>
          <div className="bg-background-light rounded-xl aspect-video flex items-center justify-center border-2 border-dashed border-border">
            <div className="text-center">
              <Navigation className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-text-muted text-sm mb-2">
                Carte interactive avec itinéraire optimisé
              </p>
              <p className="text-text-muted text-xs">
                Position actuelle: {tour.currentLocation.address}
              </p>
              <p className="text-text-muted text-xs mt-1">
                (À intégrer avec l'API de routing + WebSocket pour tracking temps réel)
              </p>
            </div>
          </div>
        </div>

        {/* Driver Info */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Informations livreur
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Nom" value={tour.driverName} />
            <InfoRow
              label="Téléphone"
              value={tour.driverPhone}
              actionLabel="Appeler"
              actionHref={`tel:${tour.driverPhone}`}
            />
            <InfoRow label="Type de véhicule" value={tour.vehicleType} />
            <InfoRow label="Plaque d'immatriculation" value={tour.vehiclePlate} />
          </div>
        </div>

        {/* Deliveries List */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">
            Liste des livraisons ({tour.deliveries.length})
          </h2>
          <div className="space-y-4">
            {tour.deliveries.map((delivery, index) => (
              <DeliveryItem
                key={delivery.id}
                delivery={delivery}
                isLast={index === tour.deliveries.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Components
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-xl font-bold mb-1">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  actionLabel,
  actionHref,
}: {
  label: string;
  value: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-text-muted mb-1">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="btn-secondary text-sm flex items-center gap-2 flex-shrink-0"
        >
          <Phone className="w-4 h-4" />
          {actionLabel}
        </a>
      )}
    </div>
  );
}

function DeliveryItem({ delivery, isLast }: { delivery: Delivery; isLast: boolean }) {
  const statusConfig = {
    DELIVERED: {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      bg: "bg-green-500/10",
      border: "border-green-500",
      text: "text-green-500",
      label: "Livrée",
    },
    IN_PROGRESS: {
      icon: <Navigation className="w-5 h-5 text-primary animate-pulse" />,
      bg: "bg-primary/10",
      border: "border-primary",
      text: "text-primary",
      label: "En cours",
    },
    PENDING: {
      icon: <Circle className="w-5 h-5 text-text-muted" />,
      bg: "bg-background-light",
      border: "border-border",
      text: "text-text-muted",
      label: "En attente",
    },
  };

  const status = statusConfig[delivery.status];

  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center border-2 ${status.border}`}>
          {status.icon}
        </div>
        {!isLast && <div className="w-0.5 h-full bg-border my-2"></div>}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold">{delivery.trackingCode}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-text-muted">Séquence #{delivery.sequence}</p>
          </div>
          {delivery.eta !== "-" && (
            <div className="text-right">
              <p className="text-xs text-text-muted mb-1">ETA</p>
              <p className="text-lg font-bold text-primary">{delivery.eta}</p>
            </div>
          )}
        </div>

        <div className="space-y-2 mt-3">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{delivery.recipientName}</p>
              <p className="text-xs text-text-muted">{delivery.recipientPhone}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text-muted">
              {delivery.recipientAddress}, {delivery.recipientCity}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
            <p className="text-xs text-text-muted">
              Arrivée estimée: {delivery.estimatedArrival}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
