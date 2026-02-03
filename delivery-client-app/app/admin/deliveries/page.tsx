"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Package,
  Search,
  Filter,
  MapPin,
  User,
  Phone,
  Truck,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";

// Types
interface Delivery {
  id: string;
  trackingCode: string;
  createdAt: string;
  status: "PENDING" | "ACCEPTED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

  senderName: string;
  senderCity: string;
  senderPhone: string;

  recipientName: string;
  recipientCity: string;
  recipientPhone: string;

  packageDescription: string;
  packageWeight: number;

  driverName?: string;
  price: number;
  distance: number;
}

export default function DeliveriesManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Delivery["status"]>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Mock data - À remplacer par appel API
  const deliveries: Delivery[] = [
    {
      id: "1",
      trackingCode: "TRK-ABC123",
      createdAt: "2024-01-15 08:30",
      status: "IN_TRANSIT",
      senderName: "Marie Kamga",
      senderCity: "Yaoundé",
      senderPhone: "+237 699 12 34 56",
      recipientName: "Paul Njiki",
      recipientCity: "Douala",
      recipientPhone: "+237 677 98 76 54",
      packageDescription: "Documents officiels",
      packageWeight: 2.5,
      driverName: "Jean Dupont",
      price: 8500,
      distance: 245,
    },
    {
      id: "2",
      trackingCode: "TRK-DEF456",
      createdAt: "2024-01-15 09:15",
      status: "PENDING",
      senderName: "Joseph Mballa",
      senderCity: "Bafoussam",
      senderPhone: "+237 655 11 22 33",
      recipientName: "Alice Nkomo",
      recipientCity: "Yaoundé",
      recipientPhone: "+237 688 44 55 66",
      packageDescription: "Vêtements",
      packageWeight: 5.0,
      price: 6200,
      distance: 280,
    },
    {
      id: "3",
      trackingCode: "TRK-GHI789",
      createdAt: "2024-01-15 10:00",
      status: "ACCEPTED",
      senderName: "Sophie Ndam",
      senderCity: "Douala",
      senderPhone: "+237 699 77 88 99",
      recipientName: "Thomas Biya",
      recipientCity: "Limbé",
      recipientPhone: "+237 677 55 44 33",
      packageDescription: "Matériel électronique",
      packageWeight: 8.5,
      driverName: "Marie Kamga",
      price: 5500,
      distance: 72,
    },
    {
      id: "4",
      trackingCode: "TRK-JKL012",
      createdAt: "2024-01-14 16:30",
      status: "DELIVERED",
      senderName: "Pierre Ngono",
      senderCity: "Yaoundé",
      senderPhone: "+237 688 99 00 11",
      recipientName: "Emma Foe",
      recipientCity: "Bertoua",
      recipientPhone: "+237 655 22 33 44",
      packageDescription: "Livres et fournitures",
      packageWeight: 12.0,
      driverName: "Paul Njiki",
      price: 12000,
      distance: 350,
    },
    {
      id: "5",
      trackingCode: "TRK-MNO345",
      createdAt: "2024-01-15 11:20",
      status: "CANCELLED",
      senderName: "David Kana",
      senderCity: "Garoua",
      senderPhone: "+237 699 11 22 33",
      recipientName: "Sarah Momo",
      recipientCity: "Maroua",
      recipientPhone: "+237 677 88 99 00",
      packageDescription: "Denrées alimentaires",
      packageWeight: 15.0,
      price: 7800,
      distance: 120,
    },
  ];

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      delivery.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter((d) => d.status === "PENDING").length,
    inTransit: deliveries.filter((d) => d.status === "IN_TRANSIT").length,
    delivered: deliveries.filter((d) => d.status === "DELIVERED").length,
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
              <h1 className="font-bold text-xl">Gestion des livraisons</h1>
              <p className="text-sm text-text-muted">
                Toutes les livraisons du système
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            label="Total"
            value={stats.total.toString()}
            icon={<Package className="w-5 h-5" />}
            color="text-blue-500"
          />
          <StatsCard
            label="En attente"
            value={stats.pending.toString()}
            icon={<Clock className="w-5 h-5" />}
            color="text-yellow-500"
          />
          <StatsCard
            label="En transit"
            value={stats.inTransit.toString()}
            icon={<Truck className="w-5 h-5" />}
            color="text-primary"
          />
          <StatsCard
            label="Livrées"
            value={stats.delivered.toString()}
            icon={<CheckCircle className="w-5 h-5" />}
            color="text-green-500"
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
                  placeholder="Rechercher par code, expéditeur ou destinataire..."
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
              <option value="PENDING">En attente</option>
              <option value="ACCEPTED">Acceptée</option>
              <option value="PICKED_UP">Récupérée</option>
              <option value="IN_TRANSIT">En transit</option>
              <option value="DELIVERED">Livrée</option>
              <option value="CANCELLED">Annulée</option>
            </select>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="space-y-4">
          {filteredDeliveries.length > 0 ? (
            filteredDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onView={() => setSelectedDelivery(delivery)}
              />
            ))
          ) : (
            <div className="card text-center py-12">
              <Package className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-muted">Aucune livraison trouvée</p>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <DeliveryDetailsModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
        />
      )}
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

function DeliveryCard({
  delivery,
  onView,
}: {
  delivery: Delivery;
  onView: () => void;
}) {
  const statusConfig: Record<
    Delivery["status"],
    { bg: string; text: string; label: string }
  > = {
    PENDING: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "En attente" },
    ACCEPTED: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Acceptée" },
    PICKED_UP: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Récupérée" },
    IN_TRANSIT: { bg: "bg-primary/10", text: "text-primary", label: "En transit" },
    DELIVERED: { bg: "bg-green-500/10", text: "text-green-500", label: "Livrée" },
    CANCELLED: { bg: "bg-red-500/10", text: "text-red-500", label: "Annulée" },
  };

  const status = statusConfig[delivery.status];

  return (
    <div className="card hover:border-primary transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Left - Main Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{delivery.trackingCode}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Sender */}
            <div>
              <p className="text-xs text-text-muted mb-1">Expéditeur</p>
              <p className="text-sm font-medium">{delivery.senderName}</p>
              <p className="text-xs text-text-muted">{delivery.senderCity}</p>
            </div>

            {/* Recipient */}
            <div>
              <p className="text-xs text-text-muted mb-1">Destinataire</p>
              <p className="text-sm font-medium">{delivery.recipientName}</p>
              <p className="text-xs text-text-muted">{delivery.recipientCity}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {delivery.packageWeight} kg
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {delivery.distance} km
            </span>
            {delivery.driverName && (
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                {delivery.driverName}
              </span>
            )}
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="text-right">
            <p className="text-xs text-text-muted mb-1">Prix</p>
            <p className="text-xl font-bold text-primary">
              {delivery.price.toLocaleString()} FCFA
            </p>
          </div>
          <p className="text-xs text-text-muted">
            <Calendar className="w-3 h-3 inline mr-1" />
            {delivery.createdAt}
          </p>
          <button
            onClick={onView}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Voir détails
          </button>
        </div>
      </div>
    </div>
  );
}

function DeliveryDetailsModal({
  delivery,
  onClose,
}: {
  delivery: Delivery;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="card max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl">{delivery.trackingCode}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background-light flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Sender */}
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Expéditeur
            </h3>
            <div className="space-y-2 pl-7">
              <InfoRow label="Nom" value={delivery.senderName} />
              <InfoRow label="Ville" value={delivery.senderCity} />
              <InfoRow label="Téléphone" value={delivery.senderPhone} />
            </div>
          </div>

          {/* Recipient */}
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Destinataire
            </h3>
            <div className="space-y-2 pl-7">
              <InfoRow label="Nom" value={delivery.recipientName} />
              <InfoRow label="Ville" value={delivery.recipientCity} />
              <InfoRow label="Téléphone" value={delivery.recipientPhone} />
            </div>
          </div>

          {/* Package */}
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Colis
            </h3>
            <div className="space-y-2 pl-7">
              <InfoRow label="Description" value={delivery.packageDescription} />
              <InfoRow label="Poids" value={`${delivery.packageWeight} kg`} />
              <InfoRow label="Distance" value={`${delivery.distance} km`} />
            </div>
          </div>

          {/* Driver */}
          {delivery.driverName && (
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Livreur
              </h3>
              <div className="space-y-2 pl-7">
                <InfoRow label="Nom" value={delivery.driverName} />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-bold">Prix total</span>
              <span className="text-2xl font-bold text-primary">
                {delivery.price.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/tracking?code=${delivery.trackingCode}`}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Suivre la livraison
            </Link>
            <button onClick={onClose} className="btn-secondary flex-1">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
