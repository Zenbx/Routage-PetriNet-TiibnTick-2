"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, MapPin, Navigation, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { HubInfo } from "@/lib/hub-types";

interface DepositPageProps {
    params: {
        id: string; // delivery ID
    };
}

export default function DriverDepositPage({ params }: DepositPageProps) {
    const router = useRouter();
    const [deliveryId] = useState(params.id);
    const [delivery, setDelivery] = useState<any>(null);
    const [nearbyHubs, setNearbyHubs] = useState<HubInfo[]>([]);
    const [selectedHub, setSelectedHub] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [depositing, setDepositing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [notes, setNotes] = useState("");
    const [storageLocation, setStorageLocation] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            // Charger les détails de la livraison
            const deliveryData = await api.getDeliveryDetails(deliveryId);
            setDelivery(deliveryData);

            // Obtenir la position actuelle du livreur (simulation avec la position de pickup)
            const currentLat = deliveryData.pickupLocation?.latitude || 3.8480;
            const currentLng = deliveryData.pickupLocation?.longitude || 11.5021;

            // Charger les hubs à proximité
            const hubs = await api.getNearbyHubs(currentLat, currentLng, 20.0);
            setNearbyHubs(hubs);

            if (hubs.length === 0) {
                setError("Aucun hub disponible à proximité");
            }
        } catch (err: any) {
            console.error("Error loading data:", err);
            setError(err.message || "Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        if (!selectedHub) {
            setError("Veuillez sélectionner un hub");
            return;
        }

        if (!delivery?.driverId) {
            setError("ID du livreur introuvable");
            return;
        }

        try {
            setDepositing(true);
            setError("");

            const depositRequest = {
                deliveryId: deliveryId,
                hubNodeId: selectedHub,
                driverId: delivery.driverId,
                notes: notes.trim() || undefined,
                storageLocation: storageLocation.trim() || undefined,
            };

            const response = await api.depositAtHub(depositRequest);

            setSuccess(true);

            // Rediriger vers le dashboard après 2 secondes
            setTimeout(() => {
                router.push("/driver/dashboard");
            }, 2000);
        } catch (err: any) {
            console.error("Error depositing:", err);
            setError(err.message || "Erreur lors du dépôt");
        } finally {
            setDepositing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-muted">Chargement...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-surface-dark rounded-xl p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Dépôt réussi !</h2>
                    <p className="text-text-muted mb-4">
                        Le colis a été déposé avec succès au hub.
                    </p>
                    <p className="text-text-secondary text-sm">
                        Redirection vers le dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="container-custom max-w-4xl">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-light mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Retour</span>
                    </button>

                    <h1 className="text-3xl font-bold text-white mb-2">
                        Déposer le Colis au Hub
                    </h1>
                    {delivery && (
                        <p className="text-text-muted">
                            Code de suivi: <span className="font-mono text-primary">{delivery.trackingCode}</span>
                        </p>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Delivery Info */}
                {delivery && (
                    <div className="bg-surface-dark rounded-xl p-6 mb-6 border border-border">
                        <div className="flex items-start gap-4">
                            <Package className="w-8 h-8 text-primary flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2">Informations du colis</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-text-secondary">Destinataire</p>
                                        <p className="text-white font-medium">{delivery.recipientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Adresse</p>
                                        <p className="text-white">{delivery.recipientAddress}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hub List */}
                <div className="space-y-4 mb-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Hubs disponibles à proximité
                    </h2>

                    {nearbyHubs.length === 0 ? (
                        <div className="bg-surface-dark rounded-xl p-8 text-center border border-border">
                            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                            <p className="text-text-muted">Aucun hub disponible à proximité</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {nearbyHubs.map((hub) => (
                                <button
                                    key={hub.id}
                                    onClick={() => setSelectedHub(hub.id)}
                                    className={`bg-surface-dark rounded-xl p-6 border-2 transition-all text-left ${selectedHub === hub.id
                                            ? "border-primary shadow-lg shadow-primary/20"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white mb-1">{hub.name}</h3>
                                            <p className="text-text-secondary text-sm mb-3">{hub.address}</p>

                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-text-secondary">Distance</p>
                                                    <p className="text-white font-medium flex items-center gap-1">
                                                        <Navigation className="w-3 h-3" />
                                                        {hub.distanceKm.toFixed(1)} km
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-text-secondary">Disponibilité</p>
                                                    <p className="text-white font-medium">
                                                        {hub.availableSpace}/{hub.capacity}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-text-secondary">Statut</p>
                                                    <p className={`font-medium ${hub.isAvailable ? "text-green-400" : "text-yellow-400"}`}>
                                                        {hub.isAvailable ? "Disponible" : "Complet"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedHub === hub.id && (
                                            <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes and Storage Location */}
                {selectedHub && (
                    <div className="bg-surface-dark rounded-xl p-6 mb-6 border border-border space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Emplacement de stockage (optionnel)
                            </label>
                            <input
                                type="text"
                                value={storageLocation}
                                onChange={(e) => setStorageLocation(e.target.value)}
                                placeholder="Ex: Étagère A3, Rack 12..."
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Notes (optionnel)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Instructions spéciales, remarques..."
                                rows={3}
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                            />
                        </div>
                    </div>
                )}

                {/* Deposit Button */}
                <button
                    onClick={handleDeposit}
                    disabled={!selectedHub || depositing || nearbyHubs.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                    {depositing ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Dépôt en cours...
                        </span>
                    ) : (
                        "Confirmer le dépôt"
                    )}
                </button>
            </div>
        </div>
    );
}
