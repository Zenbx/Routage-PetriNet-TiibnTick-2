"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { driverAuth } from "@/lib/driverAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
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
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"available" | "active" | "completed">("available");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingDeliveryId, setAcceptingDeliveryId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState("Livreur");
  const [driverPhone, setDriverPhone] = useState("");

  const driverStats = {
    name: driverName,
    phone: driverPhone,
    completedToday: activeDeliveries.filter(d => d.status === "DELIVERED").length,
    earnings: activeDeliveries.filter(d => d.status === "DELIVERED").reduce((sum, d) => sum + d.price, 0),
    rating: 4.8,
  };

  useEffect(() => {
    // Vérifier l'authentification et charger les données du driver
    if (!driverAuth.isAuthenticated()) {
      router.push("/driver/login");
      return;
    }

    const driver = driverAuth.getDriver();
    if (driver) {
      setDriverName(driver.name);
      setDriverPhone(driver.phone);
    }

    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchDeliveries = async () => {
    try {
      const driver = driverAuth.getDriver();
      if (!driver) return;

      // Récupérer les livraisons disponibles via le feed filtré (uniquement PENDING)
      const pending = await api.getDeliveryFeed();

      // Récupérer les livraisons actives du livreur (déjà filtrées par le backend)
      const myDeliveries = await api.getDriverDeliveries(driver.id);

      setAvailableDeliveries(pending.map((d: any) => ({
        id: d.id,
        trackingCode: d.trackingCode,
        senderCity: d.sender?.address?.split(',').shift()?.trim() || d.sender?.address || 'Non défini',
        recipientCity: d.recipient?.address?.split(',').shift()?.trim() || d.recipient?.address || 'Non défini',
        distance: d.distance || 0,
        price: d.estimatedPrice || d.price || 0,
        pickupTime: "Dès que possible",
        packageType: d.package_?.description || 'Colis',
        status: "AVAILABLE" as const
      })));

      setActiveDeliveries(myDeliveries.map((d: any) => ({
        id: d.id,
        trackingCode: d.trackingCode,
        senderCity: d.sender?.address?.split(',').shift()?.trim() || d.sender?.address || 'Non défini',
        recipientCity: d.recipient?.address?.split(',').shift()?.trim() || d.recipient?.address || 'Non défini',
        distance: d.distance || 0,
        price: d.estimatedPrice || d.price || 0,
        pickupTime: d.status === "DELIVERED" ? "Terminé" : "En cours",
        packageType: d.package_?.description || 'Colis',
        status: d.status === "DELIVERED" ? "DELIVERED" : "IN_PROGRESS" as const
      })));
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      const driver = driverAuth.getDriver();
      if (!driver) {
        toast.error("Vous devez être connecté");
        router.push("/driver/login");
        return;
      }

      setAcceptingDeliveryId(deliveryId);
      await api.assignDriver(deliveryId, driver.id);

      // Mettre à jour immédiatement l'interface
      setAvailableDeliveries(prev => prev.filter(d => d.id !== deliveryId));
      fetchDeliveries();

      toast.success("Livraison acceptée! Vous êtes maintenant occupé.");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'acceptation");
    } finally {
      setAcceptingDeliveryId(null);
    }
  };

  const handleLogout = () => {
    driverAuth.logout();
    router.push("/driver/login");
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
              <button
                onClick={handleLogout}
                className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
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
                <button
                  onClick={handleLogout}
                  className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
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
                    isAccepting={acceptingDeliveryId === delivery.id}
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
      className={`px-6 py-3 font-medium transition-colors relative ${active
        ? "text-primary border-b-2 border-primary"
        : "text-text-muted hover:text-primary"
        }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active ? "bg-primary text-white" : "bg-background-light text-text-muted"
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
  isAccepting,
}: {
  delivery: Delivery;
  onAccept: (id: string) => void;
  isAccepting?: boolean;
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
            <span className="text-text-muted">({delivery.distance > 0 ? delivery.distance.toFixed(1) : "?"} km)</span>
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
              {delivery.price ? delivery.price ? delivery.price.toLocaleString() : '—' : '—'} FCFA
            </p>
            <p className="text-xs text-text-muted">Gain estimé</p>
          </div>
          <button
            onClick={() => onAccept(delivery.id)}
            disabled={isAccepting}
            className="btn-primary flex items-center gap-2 min-w-[140px]"
          >
            {isAccepting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Acceptation...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Accepter</span>
              </>
            )}
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
                {delivery.price ? delivery.price.toLocaleString() : '—'} FCFA
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
