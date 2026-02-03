"use client";

import { useState } from "react";
import { Package, Image as ImageIcon, AlertTriangle, Droplet, Flame, Shield, Truck, Bike, Car, Home, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PackageStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function PackageStep({ onNext, onBack }: PackageStepProps) {
  const [formData, setFormData] = useState({
    photo: null,
    designation: "",
    description: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    // Options spéciales
    fragile: false,
    perishable: false,
    liquid: false,
    insured: false,
    // Transport
    transportMode: "",
    // Services
    homePickup: false,
    homeDelivery: false,
    // Livraison express
    deliverySpeed: "standard",
  });

  const calculatePrice = () => {
    let total = 0;
    if (formData.fragile) total += 1200;
    if (formData.perishable) total += 800;
    if (formData.liquid) total += 500;
    if (formData.homePickup) total += 1000;
    if (formData.homeDelivery) total += 1000;
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ ...formData, totalPrice: calculatePrice() });
  };

  const specialOptions = [
    { id: "fragile", label: "Fragile", icon: AlertTriangle, price: 1200 },
    { id: "perishable", label: "Périssable", icon: Flame, price: 800 },
    { id: "liquid", label: "Liquide", icon: Droplet, price: 500 },
    { id: "insured", label: "Assuré", icon: Shield, price: 0 },
  ];

  const transportModes = [
    { id: "truck", label: "Camion", icon: Truck },
    { id: "tricycle", label: "Tricycle", icon: Bike },
    { id: "moto", label: "Moto", icon: Bike },
    { id: "bike", label: "Vélo", icon: Bike },
    { id: "car", label: "Voiture", icon: Car },
  ];

  const deliverySpeeds = [
    { id: "standard", label: "Standard", subtitle: "3-5 jours ouvrables", icon: Package, recommended: true },
    { id: "express48", label: "Express 48h", subtitle: "Livraison en 2 jours", icon: Clock },
    { id: "express24", label: "Express 24h", subtitle: "Livraison en 1 jour", icon: Zap },
  ];

  const hasPhoto = false; // Simulation - à remplacer par vraie logique
  const canContinue = formData.designation && formData.weight && hasPhoto;

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo du colis */}
          <div className="card">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              Photo du colis <span className="text-primary">*</span>
            </label>
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-text-muted" />
              <p className="text-text-muted">Cliquez pour ajouter une photo</p>
              <p className="text-xs text-text-dark mt-1">PNG, JPG jusqu'à 5MB</p>
            </div>
          </div>

          {/* Informations de base */}
          <div className="card space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Informations de base
            </h3>
            <div>
              <label className="block text-sm font-medium mb-2">
                Désignation du colis <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Ex: Vêtements, Livres, Électronique..."
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description détaillée</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le contenu de votre colis..."
                rows={4}
                className="input-field resize-none"
              />
            </div>
          </div>

          {/* Poids et dimensions */}
          <div className="card space-y-4">
            <h3 className="font-bold">Poids et dimensions</h3>
            <div>
              <label className="block text-sm font-medium mb-2">
                Poids (kg) <span className="text-primary">*</span>
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="1.5"
                step="0.1"
                className="input-field"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Longueur (cm)</label>
                <input
                  type="number"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  placeholder="20"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Largeur (cm)</label>
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  placeholder="15"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hauteur (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="10"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Options spéciales */}
          <div className="card space-y-4">
            <h3 className="font-bold">Options spéciales</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {specialOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData[option.id as keyof typeof formData];
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, [option.id]: !isSelected })}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-background-card border-border hover:border-border-light"
                    )}
                  >
                    <Icon className={cn("w-6 h-6 mx-auto mb-2", isSelected ? "text-primary" : "text-text-muted")} />
                    <div className="font-bold text-sm">{option.label}</div>
                    {option.price > 0 && (
                      <div className="text-xs text-primary mt-1">+ {option.price} FCFA</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Moyen de transport */}
          <div className="card space-y-4">
            <h3 className="font-bold">Moyen de transport (optionnel)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {transportModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = formData.transportMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, transportMode: mode.id })}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-background-card border-border hover:border-border-light"
                    )}
                  >
                    <Icon className={cn("w-6 h-6 mx-auto mb-2", isSelected ? "text-primary" : "text-text-muted")} />
                    <div className="font-medium text-sm text-center">{mode.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services additionnels */}
          <div className="card space-y-4">
            <h3 className="font-bold">Services additionnels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, homePickup: !formData.homePickup })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-left",
                  formData.homePickup
                    ? "bg-primary/10 border-primary"
                    : "bg-background-card border-border hover:border-border-light"
                )}
              >
                <div className="flex items-start gap-3">
                  <Home className={cn("w-5 h-5 mt-0.5", formData.homePickup ? "text-primary" : "text-text-muted")} />
                  <div className="flex-1">
                    <div className="font-bold text-sm">Récupération à domicile</div>
                    <div className="text-xs text-text-muted mt-1">Un livreur vient chercher le colis</div>
                    <div className="text-xs text-primary mt-2">+ 1 000 FCFA</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, homeDelivery: !formData.homeDelivery })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-left",
                  formData.homeDelivery
                    ? "bg-primary/10 border-primary"
                    : "bg-background-card border-border hover:border-border-light"
                )}
              >
                <div className="flex items-start gap-3">
                  <Home className={cn("w-5 h-5 mt-0.5", formData.homeDelivery ? "text-primary" : "text-text-muted")} />
                  <div className="flex-1">
                    <div className="font-bold text-sm">Livraison à domicile</div>
                    <div className="text-xs text-text-muted mt-1">Livraison directe au destinataire</div>
                    <div className="text-xs text-primary mt-2">+ 1 000 FCFA</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Livraison express */}
          <div className="card space-y-4">
            <h3 className="font-bold">Livraison express</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deliverySpeeds.map((speed) => {
                const Icon = speed.icon;
                const isSelected = formData.deliverySpeed === speed.id;
                return (
                  <button
                    key={speed.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, deliverySpeed: speed.id })}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all relative",
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-background-card border-border hover:border-border-light"
                    )}
                  >
                    {speed.recommended && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Recommandé
                      </div>
                    )}
                    <Icon className={cn("w-8 h-8 mx-auto mb-2", isSelected ? "text-primary" : "text-text-muted")} />
                    <div className="font-bold text-sm text-center">{speed.label}</div>
                    <div className="text-xs text-text-muted text-center mt-1">{speed.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Résumé (1/3) */}
        <div>
          <div className="card border-2 border-primary/30 sticky top-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Résumé du colis
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-text-muted">Désignation:</p>
                <p className="font-medium">{formData.designation || "..."}</p>
              </div>
              <div>
                <p className="text-text-muted">Poids:</p>
                <p className="font-medium">{formData.weight ? `${formData.weight} kg` : "..."}</p>
              </div>
              <hr className="border-border" />
              <div className="bg-background-light p-3 rounded-lg">
                <p className="text-text-muted text-xs mb-1">Prix de manutention</p>
                {canContinue ? (
                  <p className="text-2xl font-bold text-primary">{calculatePrice()} FCFA</p>
                ) : (
                  <p className="text-sm text-text-muted">Complétez le formulaire</p>
                )}
              </div>
              {!hasPhoto && (
                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-red-400 text-xs">
                  Veuillez ajouter une photo du colis
                </div>
              )}
            </div>
            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={!canContinue}
                className={cn(
                  "w-full btn-primary",
                  !canContinue && "opacity-50 cursor-not-allowed"
                )}
              >
                Continuer vers les adresses →
              </button>
              <button
                type="button"
                onClick={onBack}
                className="w-full btn-secondary"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
