"use client";

import { useState } from "react";
import {
  Package,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Truck,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

// Types
interface Delivery {
  id: string;
  trackingCode: string;
  senderCity: string;
  recipientCity: string;
  distance: number;
  price: number;
  pickupTime: string;
  packageType: string;
  status: "AVAILABLE" | "IN_PROGRESS" | "DELIVERED";
}

export default function DriverDashboardPage() {
  const [activeTab, setActiveTab] = useState<"available" | "active" | "completed">("available");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock data - À remplacer par des appels API
  const driverStats = {
    name: "Jean Dupont",
    phone: "+237 699 12 34 56",
    completedToday: 8,
    earnings: 45000,
    rating: 4.8,
  };

  const availableDeliveries: Delivery[] = [
    {
      id: "1",
      trackingCode: "TRK-ABC123",
      senderCity: "Yaoundé",
      recipientCity: "Douala",
      distance: 245,
      price: 8500,
      pickupTime: "Aujourd'hui 14:00",
      packageType: "Standard",
      status: "AVAILABLE",
    },
    {
      id: "2",
      trackingCode: "TRK-DEF456",
      senderCity: "Bafoussam",
      recipientCity: "Yaoundé",
      distance: 280,
      price: 9200,
      pickupTime: "Aujourd'hui 16:30",
      packageType: "Express 24h",
      status: "AVAILABLE",
    },
    {
      id: "3",
      trackingCode: "TRK-GHI789",
      senderCity: "Douala",
      recipientCity: "Limbé",
      distance: 72,
      price: 4500,
      pickupTime: "Demain 09:00",
      packageType: "Fragile",
      status: "AVAILABLE",
    },
  ];

  const activeDeliveries: Delivery[] = [
    {
      id: "4",
      trackingCode: "TRK-JKL012",
      senderCity: "Yaoundé",
      recipientCity: "Bertoua",
      distance: 350,
      price: 12000,
      pickupTime: "En cours",
      packageType: "Express 48h",
      status: "IN_PROGRESS",
    },
  ];

  const handleAcceptDelivery = (deliveryId: string) => {
    console.log("Accepting delivery:", deliveryId);
    // TODO: Intégrer avec l'API
    alert("Livraison acceptée ! (À connecter à l'API)");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background-card border-b border-border sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg">TIIBNTICK</h1>
                <p className="text-xs text-text-muted">Espace Livreur</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-primary" />
                <span className="text-text-muted">{driverStats.name}</span>
              </div>
              <Link
                href="/driver/login"
                className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-primary"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-border">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-text-muted">{driverStats.name}</span>
                </div>
                <Link
                  href="/driver/login"
                  className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Livraisons aujourd'hui"
            value={driverStats.completedToday.toString()}
            color="text-green-500"
          />
          <StatsCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Gains du jour"
            value={`${driverStats.earnings.toLocaleString()} FCFA`}
            color="text-primary"
          />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Note moyenne"
            value={driverStats.rating.toString()}
            color="text-yellow-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <TabButton
            active={activeTab === "available"}
            onClick={() => setActiveTab("available")}
            label="Disponibles"
            count={availableDeliveries.length}
          />
          <TabButton
            active={activeTab === "active"}
            onClick={() => setActiveTab("active")}
            label="En cours"
            count={activeDeliveries.length}
          />
          <TabButton
            active={activeTab === "completed"}
            onClick={() => setActiveTab("completed")}
            label="Terminées"
            count={0}
          />
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "available" && (
            <>
              {availableDeliveries.length > 0 ? (
                availableDeliveries.map((delivery) => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    onAccept={handleAcceptDelivery}
                  />
                ))
              ) : (
                <EmptyState message="Aucune livraison disponible pour le moment" />
              )}
            </>
          )}

          {activeTab === "active" && (
            <>
              {activeDeliveries.length > 0 ? (
                activeDeliveries.map((delivery) => (
                  <ActiveDeliveryCard key={delivery.id} delivery={delivery} />
                ))
              ) : (
                <EmptyState message="Vous n'avez aucune livraison en cours" />
              )}
            </>
          )}

          {activeTab === "completed" && (
            <EmptyState message="Aucune livraison terminée aujourd'hui" />
          )}
        </div>
      </div>
    </div>
  );
}

// Components
function StatsCard({
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
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full bg-background-light flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-text-muted text-sm">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium transition-colors relative ${
        active
          ? "text-primary border-b-2 border-primary"
          : "text-text-muted hover:text-primary"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            active ? "bg-primary text-white" : "bg-background-light text-text-muted"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function DeliveryCard({
  delivery,
  onAccept,
}: {
  delivery: Delivery;
  onAccept: (id: string) => void;
}) {
  return (
    <div className="card hover:border-primary transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side - Delivery Info */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-lg">{delivery.trackingCode}</p>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                {delivery.packageType}
              </span>
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-medium">{delivery.senderCity}</span>
            <span className="text-text-muted">→</span>
            <span className="font-medium">{delivery.recipientCity}</span>
            <span className="text-text-muted">({delivery.distance} km)</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Clock className="w-4 h-4" />
            <span>Récupération: {delivery.pickupTime}</span>
          </div>
        </div>

        {/* Right Side - Price & Action */}
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {delivery.price.toLocaleString()} FCFA
            </p>
            <p className="text-xs text-text-muted">Gain estimé</p>
          </div>
          <button
            onClick={() => onAccept(delivery.id)}
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveDeliveryCard({ delivery }: { delivery: Delivery }) {
  return (
    <Link href={`/driver/deliveries/${delivery.id}`} className="block">
      <div className="card hover:border-primary transition-all">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left Side */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-lg">{delivery.trackingCode}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                  En cours de livraison
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium">{delivery.senderCity}</span>
              <span className="text-text-muted">→</span>
              <span className="font-medium">{delivery.recipientCity}</span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-xl font-bold text-primary">
                {delivery.price.toLocaleString()} FCFA
              </p>
            </div>
            <span className="text-sm text-primary hover:text-primary-light transition-colors">
              Voir les détails →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card text-center py-12">
      <Package className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
      <p className="text-text-muted">{message}</p>
    </div>
  );
}
