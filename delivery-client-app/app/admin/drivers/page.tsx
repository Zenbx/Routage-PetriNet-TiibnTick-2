"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Truck,
  Search,
  User,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

// Types
interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehiclePlate: string;
  city: string;
  region: string;
  status: "ACTIVE" | "OFFLINE" | "BUSY";
  rating: number;
  totalDeliveries: number;
  completedToday: number;
  earnings: number;
  joinedDate: string;
}

export default function DriversManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Driver["status"]>("all");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch drivers from API
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);

        // Fetch all deliveries to extract driver info
        const allDeliveries = await api.getAllDeliveries();
        const driverMap = new Map<string, any>();

        // Extract unique drivers from deliveries
        allDeliveries.forEach((delivery: any) => {
          if (delivery.driverId && !driverMap.has(delivery.driverId)) {
            driverMap.set(delivery.driverId, {
              id: delivery.driverId,
              deliveries: [],
            });
          }
          if (delivery.driverId) {
            driverMap.get(delivery.driverId)!.deliveries.push(delivery);
          }
        });

        // Convert to Driver objects
        const driversData: Driver[] = Array.from(driverMap.entries()).map(
          ([driverId, data], index) => {
            const deliveries = data.deliveries;
            const hasActive = deliveries.some(
              (d: any) => ["ACCEPTED", "PICKED_UP", "IN_TRANSIT"].includes(d.status)
            );
            const completedToday = deliveries.filter(
              (d: any) =>
                d.status === "DELIVERED" &&
                new Date(d.deliveredAt).toDateString() === new Date().toDateString()
            );

            return {
              id: driverId,
              name: driverId,
              phone: "N/A",
              vehicleType: "Véhicule",
              vehiclePlate: "N/A",
              city: deliveries[0]?.senderCity || "N/A",
              region: deliveries[0]?.senderRegion || "N/A",
              status: hasActive ? "BUSY" : "ACTIVE",
              rating: 4.5,
              totalDeliveries: deliveries.length,
              completedToday: completedToday.length,
              earnings: completedToday.reduce((sum: number, d: any) => sum + (d.price || 0), 0),
              joinedDate: new Date().toISOString().split("T")[0],
            };
          }
        );

        setDrivers(driversData);
      } catch (error) {
        console.error("Erreur lors du chargement des livreurs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const filteredDrivers = drivers.filter((driver) => {
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: drivers.length,
    active: drivers.filter((d) => d.status === "ACTIVE").length,
    busy: drivers.filter((d) => d.status === "BUSY").length,
    offline: drivers.filter((d) => d.status === "OFFLINE").length,
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-background-card border-b border-border sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="w-10 h-10 rounded-full bg-background-light flex items-center justify-center hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-xl">Gestion des livreurs</h1>
              <p className="text-sm text-text-muted">
                Tous les livreurs de la plateforme
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            label="Total livreurs"
            value={stats.total.toString()}
            icon={<User className="w-5 h-5" />}
            color="text-blue-500"
          />
          <StatsCard
            label="Disponibles"
            value={stats.active.toString()}
            icon={<CheckCircle className="w-5 h-5" />}
            color="text-green-500"
          />
          <StatsCard
            label="En livraison"
            value={stats.busy.toString()}
            icon={<Truck className="w-5 h-5" />}
            color="text-primary"
          />
          <StatsCard
            label="Hors ligne"
            value={stats.offline.toString()}
            icon={<Clock className="w-5 h-5" />}
            color="text-text-muted"
          />
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, ID ou téléphone..."
                  className="input-field pl-11 w-full"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input-field"
            >
              <option value="all">Tous les statuts</option>
              <option value="ACTIVE">Disponible</option>
              <option value="BUSY">En livraison</option>
              <option value="OFFLINE">Hors ligne</option>
            </select>
          </div>
        </div>

        {/* Drivers List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 card text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-muted">Chargement des livreurs...</p>
            </div>
          ) : filteredDrivers.length > 0 ? (
            filteredDrivers.map((driver) => (
              <DriverCard key={driver.id} driver={driver} />
            ))
          ) : (
            <div className="col-span-2 card text-center py-12">
              <User className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-muted">Aucun livreur trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Components
function StatsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
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

function DriverCard({ driver }: { driver: Driver }) {
  const statusConfig = {
    ACTIVE: {
      bg: "bg-green-500/10",
      text: "text-green-500",
      label: "Disponible",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    BUSY: {
      bg: "bg-primary/10",
      text: "text-primary",
      label: "En livraison",
      icon: <Navigation className="w-4 h-4 animate-pulse" />,
    },
    OFFLINE: {
      bg: "bg-text-muted/10",
      text: "text-text-muted",
      label: "Hors ligne",
      icon: <Clock className="w-4 h-4" />,
    },
  };

  const status = statusConfig[driver.status];

  return (
    <div className="card hover:border-primary transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{driver.name}</h3>
            <p className="text-xs text-text-muted">{driver.id}</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-full ${status.bg} ${status.text} flex items-center gap-1.5 text-sm`}>
          {status.icon}
          {status.label}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Phone className="w-4 h-4 flex-shrink-0" />
          <span>{driver.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{driver.city}, {driver.region}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Truck className="w-4 h-4 flex-shrink-0" />
          <span>{driver.vehicleType} • {driver.vehiclePlate}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-text-muted mb-1">Note moyenne</p>
          <p className="font-bold flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-yellow-500" />
            {driver.rating}/5
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Total livraisons</p>
          <p className="font-bold flex items-center gap-1">
            <Package className="w-4 h-4 text-blue-500" />
            {driver.totalDeliveries}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Aujourd'hui</p>
          <p className="font-bold flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            {driver.completedToday}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Gains du jour</p>
          <p className="font-bold flex items-center gap-1 text-primary">
            <DollarSign className="w-4 h-4" />
            {driver.earnings.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <a
          href={`tel:${driver.phone}`}
          className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
        >
          <Phone className="w-4 h-4" />
          Appeler
        </a>
        <button className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
          <User className="w-4 h-4" />
          Voir profil
        </button>
      </div>
    </div>
  );
}
