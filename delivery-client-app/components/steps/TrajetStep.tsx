"use client";

import { useState, useEffect } from "react";
import { Route, MapPin, Clock, Calendar, Loader2 } from "lucide-react";
import { api, formatETA } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface TrajetStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  senderData?: any;
  recipientData?: any;
}

export function TrajetStep({ onNext, onBack, senderData, recipientData }: TrajetStepProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    preferredDate: "",
    preferredTime: "morning",
    notes: "",
    distance: 0,
    duration: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateRoute = async () => {
      if (!senderData?.city || !recipientData?.city) return;

      setIsLoading(true);
      setError(null);
      try {
        // 1. Trouver les nodes pour les villes
        const originNode = await api.findNodeByName(senderData.city);
        const destNode = await api.findNodeByName(recipientData.city);

        if (!originNode || !destNode) {
          throw new Error("Impossible de localiser les villes dans notre réseau routier");
        }

        // 2. Calculer le plus court chemin
        const result = await api.findShortestPath(originNode.id, destNode.id);

        if (result) {
          setFormData(prev => ({
            ...prev,
            distance: result.distance,
            duration: result.estimatedTime
          }));
        }
      } catch (err: any) {
        console.error("Erreur de calcul d'itinéraire:", err);
        const errorMessage = err.message || "Erreur lors du calcul de l'itinéraire";
        setError(errorMessage);
        toast.error("Impossible de calculer l'itinéraire. Veuillez réessayer dans quelques minutes");
      } finally {
        setIsLoading(false);
      }
    };

    calculateRoute();
  }, [senderData?.city, recipientData?.city]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const timeSlots = [
    { id: "morning", label: "Matin", time: "8h - 12h" },
    { id: "afternoon", label: "Après-midi", time: "12h - 17h" },
    { id: "evening", label: "Soir", time: "17h - 20h" },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="card">
        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Route className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Planification du trajet</h2>
            <p className="text-text-muted text-sm">Choisissez vos préférences de livraison</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Résumé du trajet */}
          <div className="bg-background-light p-6 rounded-xl border border-border">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Trajet de livraison
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                <div>
                  <p className="text-sm text-text-muted">Point de départ</p>
                  <p className="font-medium">
                    {senderData?.city || "..."}, {senderData?.region || "..."}
                  </p>
                  <p className="text-xs text-text-muted">{senderData?.address || "..."}</p>
                </div>
              </div>
              <div className="ml-1.5 border-l-2 border-dashed border-primary/30 h-8" />
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
                <div>
                  <p className="text-sm text-text-muted">Destination</p>
                  <p className="font-medium">
                    {recipientData?.city || "..."}, {recipientData?.region || "..."}
                  </p>
                  <p className="text-xs text-text-muted">{recipientData?.address || "..."}</p>
                </div>
              </div>
            </div>

            {/* Service Type Summary */}
            <div className="mt-6 flex flex-col gap-2">
              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${senderData?.pickupType === 'HOME' ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-700'}`}>
                <span className="font-medium">Collecte : {senderData?.pickupType === 'HOME' ? 'À Domicile (+1000 FCFA)' : 'En Point Relais (Hub)'}</span>
                {senderData?.pickupType !== 'HOME' && <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">Requis</span>}
              </div>
              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${recipientData?.deliveryType === 'HOME' ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-700'}`}>
                <span className="font-medium">Livraison : {recipientData?.deliveryType === 'HOME' ? 'À Domicile (+1000 FCFA)' : 'En Point Relais (Hub)'}</span>
                {recipientData?.deliveryType !== 'HOME' && <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">Requis</span>}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted">Distance estimée</p>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-primary animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calcul...</span>
                  </div>
                ) : error ? (
                  <p className="font-bold text-red-500 text-xs">{error}</p>
                ) : (
                  <p className="font-bold text-primary">
                    {formData.distance > 0 ? `${formData.distance.toFixed(1)} km` : "Non disponible"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-text-muted">Durée estimée</p>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-primary animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calcul...</span>
                  </div>
                ) : error ? (
                  <p className="font-bold text-red-500 text-xs">-</p>
                ) : (
                  <p className="font-bold text-primary">
                    {formData.duration > 0 ? formatETA(formData.duration * 60) : "Non disponible"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Date préférée */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Date de livraison préférée
            </label>
            <input
              type="date"
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              className="input-field"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Créneau horaire */}
          <div>
            <label className="block text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Créneau horaire préféré
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, preferredTime: slot.id })}
                  className={`p-4 rounded-xl border-2 transition-all ${formData.preferredTime === slot.id
                    ? "bg-primary/10 border-primary"
                    : "bg-background-card border-border hover:border-border-light"
                    }`}
                >
                  <div className="font-bold text-sm">{slot.label}</div>
                  <div className="text-xs text-text-muted mt-1">{slot.time}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes spéciales */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Instructions spéciales (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instructions pour le livreur..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-8">
          <button type="button" onClick={onBack} className="btn-secondary">
            ← Retour
          </button>
          <button type="submit" className="btn-primary">
            Continuer →
          </button>
        </div>
      </div>
    </form>
  );
}
