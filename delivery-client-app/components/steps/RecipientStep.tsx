"use client";

import { useState, useEffect } from "react";
import { MapPin, Globe, Map, Map as MapIcon, X } from "lucide-react";
import { getCountries, getRegionsByCountry, getCitiesByRegion } from "@/lib/locations";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(
  () => import("@/components/map/LocationPickerMap").then((mod) => mod.LocationPickerMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-black/20 animate-pulse rounded-3xl" /> }
);

interface RecipientStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function RecipientStep({ onNext, onBack }: RecipientStepProps) {
  const [showMap, setShowMap] = useState(false);
  const [hubs, setHubs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    country: "Cameroun",
    region: "",
    city: "",
    address: "",
    landmark: "",
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    api.getHubs().then(setHubs).catch(console.error);
  }, []);

  const countries = getCountries();
  const regions = getRegionsByCountry(formData.country);
  const cities = getCitiesByRegion(formData.country, formData.region);

  const handleCountryChange = (country: string) => {
    setFormData({ ...formData, country, region: "", city: "" });
  };

  const handleRegionChange = (region: string) => {
    setFormData({ ...formData, region, city: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const handleMapSelect = (data: { latitude: number; longitude: number; address: string; city: string }) => {
    setFormData({
      ...formData,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      city: data.city || formData.city
    });
    setShowMap(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Map Selection Modal/Overlay */}
      {showMap && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md p-4 md:p-10 flex items-center justify-center">
          <div className="w-full h-full max-w-5xl relative">
            <button
              onClick={() => setShowMap(false)}
              className="absolute -top-12 right-0 text-white/60 hover:text-white flex items-center gap-2 text-sm font-medium"
            >
              Fermer <X className="w-5 h-5" />
            </button>
            <LocationPickerMap
              onLocationSelect={handleMapSelect}
              onCancel={() => setShowMap(false)}
              hubs={hubs}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          {/* Icon + Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Informations destinataire</h2>
                <p className="text-text-muted text-sm">Renseignez les coordonnées pour la réception</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-2 text-sm font-bold shadow-lg"
            >
              <MapIcon className="w-4 h-4" />
              Choisir sur la carte
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Nom et Téléphone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom Complet <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Téléphone <span className="text-primary">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+237 6XX XX XX XX"
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email (optionnel)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nom@example.com"
                className="input-field"
              />
            </div>

            {/* Localisation Hybrid */}
            <div className="card bg-primary/5 border-primary/20 border-dashed space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Lieu de Livraison
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Région</label>
                  <select
                    value={formData.region}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Sélectionner</option>
                    {regions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ville</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Sélectionner</option>
                    {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Lieu-dit <span className="text-primary">*</span></label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="Ex: Près du marché..."
                    className="input-field border-orange-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Adresse / Rue</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Utilisez le bouton 'Choisir sur la carte' pour plus de précision"
                    className="input-field pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/10 p-1.5 rounded-lg">
                    <MapIcon className={`w-4 h-4 ${formData.latitude ? 'text-primary' : 'text-text-muted animate-pulse'}`} />
                  </div>
                </div>
                {formData.latitude > 0 && (
                  <p className="text-[10px] text-primary mt-2 font-medium">
                    📍 Coordonnées GPS capturées : {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button type="button" onClick={onBack} className="btn-secondary">
              ← Retour
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              Continuer
              <span>→</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
