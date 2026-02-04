"use client";

import { useState } from "react";
import { Package, Phone, User, CheckCircle, AlertCircle, Search, MapPin, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function HubPickupPage() {
    const router = useRouter();
    const [step, setStep] = useState<"search" | "validate" | "success">("search");
    const [trackingCode, setTrackingCode] = useState("");
    const [parcelInfo, setParcelInfo] = useState<any>(null);
    const [pickupPhone, setPickupPhone] = useState("");
    const [pickupName, setPickupName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingCode.trim()) return;

        setLoading(true);
        setError("");

        try {
            const data = await api.checkParcelAtHub(trackingCode.trim());
            setParcelInfo(data);

            // Vérifier disponibilité
            if (!data.availableForPickup) {
                setError(`Ce colis n'est pas disponible à la récupération (Statut: ${data.status})`);
                return;
            }

            setStep("validate");
        } catch (err: any) {
            console.error("Error checking parcel:", err);
            setError(err.message || "Code de suivi invalide ou colis non trouvé au hub");
        } finally {
            setLoading(false);
        }
    };

    const handlePickup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pickupPhone.trim() || !pickupName.trim()) {
            setError("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await api.pickupFromHub({
                trackingCode: trackingCode,
                pickupPhone: pickupPhone.trim(),
                pickupName: pickupName.trim(),
            });

            setStep("success");
        } catch (err: any) {
            console.error("Error during pickup:", err);
            setError(err.message || "Erreur lors de la récupération. Vérifiez votre numéro de téléphone.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep("search");
        setTrackingCode("");
        setParcelInfo(null);
        setPickupPhone("");
        setPickupName("");
        setError("");
    };

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="container-custom max-w-2xl py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl mb-4">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Récupération au Hub
                    </h1>
                    <p className="text-text-muted">
                        Récupérez votre colis déposé au point relais
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === "search" ? "bg-primary text-white" : "bg-surface-dark text-text-muted"
                        }`}>
                        <Search className="w-4 h-4" />
                        <span className="text-sm font-medium">Recherche</span>
                    </div>
                    <div className="w-8 h-0.5 bg-border" />
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === "validate" ? "bg-primary text-white" : "bg-surface-dark text-text-muted"
                        }`}>
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">Validation</span>
                    </div>
                    <div className="w-8 h-0.5 bg-border" />
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === "success" ? "bg-primary text-white" : "bg-surface-dark text-text-muted"
                        }`}>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Confirmé</span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Step 1: Search */}
                {step === "search" && (
                    <div className="bg-surface-dark rounded-xl p-6 border border-border">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Code de suivi
                                </label>
                                <input
                                    type="text"
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                                    placeholder="Ex: TRK-ABC123XYZ"
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors font-mono"
                                    disabled={loading}
                                />
                                <p className="text-text-muted text-xs mt-1">
                                    Entrez le code de suivi fourni lors de l'envoi
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !trackingCode.trim()}
                                className="w-full py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Recherche...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Rechercher le colis
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: Validation */}
                {step === "validate" && parcelInfo && (
                    <div className="space-y-6">
                        {/* Parcel Info Card */}
                        <div className="bg-surface-dark rounded-xl p-6 border border-border">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" />
                                Informations du colis
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-start justify-between p-3 bg-background rounded-lg">
                                    <div>
                                        <p className="text-text-secondary text-sm">Hub</p>
                                        <p className="text-white font-medium flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            {parcelInfo.hubName}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${parcelInfo.availableForPickup
                                            ? "bg-green-500/10 text-green-400"
                                            : "bg-yellow-500/10 text-yellow-400"
                                        }`}>
                                        {parcelInfo.availableForPickup ? "Disponible" : parcelInfo.status}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-background rounded-lg">
                                        <p className="text-text-secondary text-sm">Destinataire</p>
                                        <p className="text-white font-medium">{parcelInfo.recipientNameMasked}</p>
                                    </div>
                                    <div className="p-3 bg-background rounded-lg">
                                        <p className="text-text-secondary text-sm">Téléphone</p>
                                        <p className="text-white font-medium font-mono text-sm">{parcelInfo.recipientPhoneMasked}</p>
                                    </div>
                                </div>

                                {parcelInfo.storageLocation && (
                                    <div className="p-3 bg-background rounded-lg">
                                        <p className="text-text-secondary text-sm">Emplacement</p>
                                        <p className="text-white font-medium">{parcelInfo.storageLocation}</p>
                                    </div>
                                )}

                                <div className="p-3 bg-background rounded-lg">
                                    <p className="text-text-secondary text-sm flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Déposé le
                                    </p>
                                    <p className="text-white font-medium">
                                        {new Date(parcelInfo.depositTime).toLocaleString("fr-FR")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Validation Form */}
                        <div className="bg-surface-dark rounded-xl p-6 border border-border">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-primary" />
                                Validation d'identité
                            </h3>

                            <form onSubmit={handlePickup} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Nom complet <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pickupName}
                                        onChange={(e) => setPickupName(e.target.value)}
                                        placeholder="Votre nom complet"
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Numéro de téléphone <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={pickupPhone}
                                        onChange={(e) => setPickupPhone(e.target.value)}
                                        placeholder="+237 6XX XXX XXX"
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors font-mono"
                                        disabled={loading}
                                    />
                                    <p className="text-text-muted text-xs mt-1">
                                        Doit correspondre au numéro du destinataire
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 py-3 bg-surface-dark border border-border text-white rounded-xl font-semibold hover:bg-background transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !pickupPhone.trim() || !pickupName.trim()}
                                        className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Validation...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Confirmer la récupération
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === "success" && (
                    <div className="bg-surface-dark rounded-xl p-8 border border-border text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Récupération confirmée !
                        </h2>
                        <p className="text-text-muted mb-6">
                            Votre colis a été marqué comme récupéré avec succès.
                        </p>

                        <div className="bg-background rounded-lg p-4 mb-6">
                            <p className="text-text-secondary text-sm mb-1">Code de suivi</p>
                            <p className="text-white font-mono font-bold text-lg">{trackingCode}</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push("/tracking?code=" + trackingCode)}
                                className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-all"
                            >
                                Voir le suivi de livraison
                            </button>
                            <button
                                onClick={resetForm}
                                className="w-full py-3 bg-surface-dark border border-border text-white rounded-xl font-semibold hover:bg-background transition-all"
                            >
                                Récupérer un autre colis
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
