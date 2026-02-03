"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Truck,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Menu,
  X,
  LogOut,
  RefreshCw,
  Filter,
  Search,
  User,
  Phone,
} from "lucide-react";
import Link from "next/link";

// Types
interface Tour {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  deliveriesCount: number;
  completedCount: number;
  currentLocation: string;
  nextStop: string;
  eta: string;
  totalDistance: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startTime: string;
}

interface Stats {
  activeTours: number;
  activeDrivers: number;
  totalDeliveries: number;
  completedToday: number;
  pendingDeliveries: number;
  averageETA: string;
}

export default function AdminDashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "paused" | "completed">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - À remplacer par appels API en temps réel
  const stats: Stats = {
    activeTours: 12,
    activeDrivers: 15,
    totalDeliveries: 48,
    completedToday: 32,
    pendingDeliveries: 16,
    averageETA: "25 min",
  };

  const tours: Tour[] = [
    {
      id: "T001",
      driverName: "Jean Dupont",
      driverPhone: "+237 699 12 34 56",
      vehicleType: "Camion",
      deliveriesCount: 8,
      completedCount: 5,
      currentLocation: "Yaoundé, Melen",
      nextStop: "Yaoundé, Bastos",
      eta: "12 min",
      totalDistance: 45.2,
      status: "ACTIVE",
      startTime: "08:30",
    },
    {
      id: "T002",
      driverName: "Marie Kamga",
      driverPhone: "+237 677 98 76 54",
      vehicleType: "Moto",
      deliveriesCount: 6,
      completedCount: 4,
      currentLocation: "Douala, Akwa",
      nextStop: "Douala, Bonanjo",
      eta: "8 min",
      totalDistance: 28.5,
      status: "ACTIVE",
      startTime: "09:00",
    },
    {
      id: "T003",
      driverName: "Paul Njiki",
      driverPhone: "+237 655 11 22 33",
      vehicleType: "Voiture",
      deliveriesCount: 5,
      completedCount: 3,
      currentLocation: "Bafoussam, Centre",
      nextStop: "Bafoussam, Tamdja",
      eta: "15 min",
      totalDistance: 35.8,
      status: "ACTIVE",
      startTime: "08:45",
    },
    {
      id: "T004",
      driverName: "Alice Nkomo",
      driverPhone: "+237 688 44 55 66",
      vehicleType: "Tricycle",
      deliveriesCount: 4,
      completedCount: 4,
      currentLocation: "Yaoundé, Nlongkak",
      nextStop: "-",
      eta: "-",
      totalDistance: 22.3,
      status: "COMPLETED",
      startTime: "07:30",
    },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    // TODO: Appeler l'API pour rafraîchir les données
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const filteredTours = tours.filter((tour) => {
    const matchesFilter = selectedFilter === "all" || tour.status.toLowerCase() === selectedFilter;
    const matchesSearch =
      searchQuery === "" ||
      tour.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background-card border-b border-border sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg">TIIBNTICK Admin</h1>
                <p className="text-xs text-text-muted">Gestion des tournées</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualiser
              </button>
              <Link
                href="/admin/login"
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
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-border">
              <div className="space-y-3">
                <button
                  onClick={handleRefresh}
                  className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Actualiser
                </button>
                <Link
                  href="/admin/login"
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
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            icon={<Navigation className="w-5 h-5" />}
            label="Tournées actives"
            value={stats.activeTours.toString()}
            color="text-primary"
          />
          <StatsCard
            icon={<Truck className="w-5 h-5" />}
            label="Livreurs actifs"
            value={stats.activeDrivers.toString()}
            color="text-blue-500"
          />
          <StatsCard
            icon={<Package className="w-5 h-5" />}
            label="Total livraisons"
            value={stats.totalDeliveries.toString()}
            color="text-purple-500"
          />
          <StatsCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Complétées"
            value={stats.completedToday.toString()}
            color="text-green-500"
          />
          <StatsCard
            icon={<AlertCircle className="w-5 h-5" />}
            label="En attente"
            value={stats.pendingDeliveries.toString()}
            color="text-yellow-500"
          />
          <StatsCard
            icon={<Clock className="w-5 h-5" />}
            label="ETA moyen"
            value={stats.averageETA}
            color="text-text-muted"
          />
        </div>

        {/* Map Placeholder */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Carte en temps réel</h2>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Mise à jour en direct</span>
            </div>
          </div>
          <div className="bg-background-light rounded-xl aspect-video flex items-center justify-center border-2 border-dashed border-border">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-text-muted text-sm">
                Carte interactive avec toutes les tournées
              </p>
              <p className="text-text-muted text-xs mt-1">
                (À intégrer avec Google Maps / OpenStreetMap)
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom ou ID tournée..."
                className="input-field pl-11 w-full"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <FilterButton
              active={selectedFilter === "all"}
              onClick={() => setSelectedFilter("all")}
              label="Toutes"
            />
            <FilterButton
              active={selectedFilter === "active"}
              onClick={() => setSelectedFilter("active")}
              label="Actives"
            />
            <FilterButton
              active={selectedFilter === "completed"}
              onClick={() => setSelectedFilter("completed")}
              label="Terminées"
            />
          </div>
        </div>

        {/* Tours List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              Tournées ({filteredTours.length})
            </h2>
            <Link
              href="/admin/deliveries"
              className="text-sm text-primary hover:text-primary-light transition-colors"
            >
              Gérer les livraisons →
            </Link>
          </div>

          {filteredTours.length > 0 ? (
            filteredTours.map((tour) => <TourCard key={tour.id} tour={tour} />)
          ) : (
            <div className="card text-center py-12">
              <Package className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-muted">Aucune tournée trouvée</p>
            </div>
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
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
        active
          ? "bg-primary text-white"
          : "bg-background-card text-text-muted hover:bg-background-light"
      }`}
    >
      {label}
    </button>
  );
}

function TourCard({ tour }: { tour: Tour }) {
  const statusConfig = {
    ACTIVE: { color: "text-green-500", bg: "bg-green-500/10", label: "En cours" },
    PAUSED: { color: "text-yellow-500", bg: "bg-yellow-500/10", label: "En pause" },
    COMPLETED: { color: "text-blue-500", bg: "bg-blue-500/10", label: "Terminée" },
  };

  const status = statusConfig[tour.status];
  const progress = (tour.completedCount / tour.deliveriesCount) * 100;

  return (
    <Link href={`/admin/tours/${tour.id}`} className="block">
      <div className="card hover:border-primary transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Left - Driver Info */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-lg">{tour.id}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-text-muted mb-1">
                <User className="w-4 h-4 inline mr-1" />
                {tour.driverName} • {tour.vehicleType}
              </p>
              <p className="text-sm text-text-muted">
                <Phone className="w-4 h-4 inline mr-1" />
                {tour.driverPhone}
              </p>
            </div>
          </div>

          {/* Middle - Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">
                Progression: {tour.completedCount}/{tour.deliveriesCount} livraisons
              </span>
              <span className="text-sm font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-background-light rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-muted">Position actuelle</p>
                <p className="text-sm font-medium">{tour.currentLocation}</p>
              </div>
              {tour.nextStop !== "-" && (
                <div>
                  <p className="text-xs text-text-muted">Prochain arrêt</p>
                  <p className="text-sm font-medium">{tour.nextStop}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right - Stats */}
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-text-muted mb-1">ETA</p>
                <p className="text-lg font-bold text-primary">{tour.eta}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted mb-1">Distance</p>
                <p className="text-lg font-bold">{tour.totalDistance} km</p>
              </div>
            </div>
            <div className="text-sm text-text-muted">
              <Clock className="w-4 h-4 inline mr-1" />
              Début: {tour.startTime}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
