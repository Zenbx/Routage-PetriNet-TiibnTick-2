"use client";

import { useState, useEffect } from "react";
import { Search, QrCode, Package, MapPin, Clock, User, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";

  const [trackingCode, setTrackingCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  // Auto-track si code dans URL
  useEffect(() => {
    if (codeFromUrl) {
      handleSubmit(new Event("submit") as any);
    }
  }, [codeFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const data = await api.trackDelivery(trackingCode.trim());
      setTrackingInfo(data);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setTrackingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      ACCEPTED: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      PICKED_UP: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
      IN_TRANSIT: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      DELIVERED: "bg-green-500/10 text-green-500 border-green-500/30",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500 border-gray-500/30";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "En attente",
      ACCEPTED: "Accepté",
      PICKED_UP: "Récupéré",
      IN_TRANSIT: "En transit",
      DELIVERED: "Livré",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Suivi de Colis
          </h1>
          <p className="text-text-muted text-lg">
            Entrez votre numéro de suivi pour localiser votre expédition.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-background-card border-2 border-border rounded-2xl p-4 focus-within:border-primary transition-all">
              <Search className="w-6 h-6 text-text-muted flex-shrink-0" />
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Ex: TRK-ABCD123XY"
                className="flex-1 bg-transparent text-text text-lg outline-none placeholder:text-text-muted"
                disabled={loading}
              />
              <button
                type="button"
                className="p-2 hover:bg-background-light rounded-lg transition-colors"
                title="Scanner QR Code"
              >
                <QrCode className="w-6 h-6 text-text-muted" />
              </button>
              <button
                type="submit"
                disabled={loading || !trackingCode.trim()}
                className="btn-primary px-8 disabled:opacity-50"
              >
                {loading ? "Recherche..." : "Suivre"}
              </button>
            </div>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Info */}
        {trackingInfo && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Status Card */}
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-text-muted text-sm mb-1">Code de suivi</div>
                  <div className="text-2xl font-bold text-white">
                    {trackingInfo.trackingCode}
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-full border font-bold text-sm ${getStatusColor(
                    trackingInfo.status
                  )}`}
                >
                  {getStatusLabel(trackingInfo.status)}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">Progression</span>
                  <span className="text-primary font-bold">
                    {trackingInfo.progressPercentage || 0}%
                  </span>
                </div>
                <div className="h-2 bg-background-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${trackingInfo.progressPercentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Package Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-background-light rounded-xl">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-text-muted text-xs">Colis</div>
                    <div className="text-white font-medium">
                      {trackingInfo.packageDescription}
                    </div>
                    <div className="text-text-muted text-xs">
                      {trackingInfo.weight} kg
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-text-muted text-xs">Destinataire</div>
                    <div className="text-white font-medium">
                      {trackingInfo.recipientName}
                    </div>
                    <div className="text-text-muted text-xs">
                      {trackingInfo.recipientAddress}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Historique de livraison
              </h3>
              <div className="space-y-4">
                {trackingInfo.createdAt && (
                  <TimelineItem
                    title="Demande créée"
                    date={new Date(trackingInfo.createdAt).toLocaleString("fr-FR")}
                    isCompleted
                  />
                )}
                {trackingInfo.acceptedAt && (
                  <TimelineItem
                    title="Acceptée par un livreur"
                    date={new Date(trackingInfo.acceptedAt).toLocaleString("fr-FR")}
                    isCompleted
                  />
                )}
                {trackingInfo.pickedUpAt && (
                  <TimelineItem
                    title="Colis récupéré"
                    date={new Date(trackingInfo.pickedUpAt).toLocaleString("fr-FR")}
                    isCompleted
                  />
                )}
                {trackingInfo.deliveredAt && (
                  <TimelineItem
                    title="Livré"
                    date={new Date(trackingInfo.deliveredAt).toLocaleString("fr-FR")}
                    isCompleted
                    isLast
                  />
                )}
                {trackingInfo.estimatedDeliveryTime && !trackingInfo.deliveredAt && (
                  <TimelineItem
                    title="Livraison estimée"
                    date={new Date(trackingInfo.estimatedDeliveryTime).toLocaleString("fr-FR")}
                    isCompleted={false}
                    isLast
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        {!trackingInfo && !error && (
          <div className="max-w-2xl mx-auto">
            <div className="card text-center py-12">
              <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Où est mon colis ?</h3>
              <p className="text-text-muted text-sm">
                Entrez votre code de suivi ci-dessus pour suivre votre expédition en temps réel.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  isCompleted,
  isLast = false,
}: {
  title: string;
  date: string;
  isCompleted: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full border-2 ${
            isCompleted
              ? "bg-primary border-primary"
              : "bg-background border-border"
          }`}
        />
        {!isLast && (
          <div
            className={`w-0.5 h-12 ${
              isCompleted ? "bg-primary" : "bg-border"
            }`}
          />
        )}
      </div>
      <div className="flex-1 pb-8">
        <div className={`font-medium ${isCompleted ? "text-white" : "text-text-muted"}`}>
          {title}
        </div>
        <div className="text-text-muted text-sm">{date}</div>
      </div>
    </div>
  );
}
