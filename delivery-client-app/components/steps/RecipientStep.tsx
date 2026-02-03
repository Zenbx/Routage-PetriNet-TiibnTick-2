"use client";

import { useState } from "react";
import { MapPin, Globe, Map } from "lucide-react";
import { getCountries, getRegionsByCountry, getCitiesByRegion } from "@/lib/locations";

interface RecipientStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function RecipientStep({ onNext, onBack }: RecipientStepProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    country: "Cameroun",
    region: "",
    city: "",
    address: "",
    landmark: "",
  });

  const countries = getCountries();
  const regions = getRegionsByCountry(formData.country);
  const cities = getCitiesByRegion(formData.country, formData.region);

  // Reset region and city when country changes
  const handleCountryChange = (country: string) => {
    setFormData({ ...formData, country, region: "", city: "" });
  };

  // Reset city when region changes
  const handleRegionChange = (region: string) => {
    setFormData({ ...formData, region, city: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="card">
        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Informations destinataire</h2>
            <p className="text-text-muted text-sm">Renseignez les coordonnées du destinataire</p>
          </div>
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
                placeholder="+234 802 345 6789"
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

          {/* Pays, Région, Ville */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pays <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none z-10" />
                <select
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="input-field pl-11"
                  required
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Région <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none z-10" />
                <select
                  value={formData.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="input-field pl-11"
                  required
                  disabled={!formData.country}
                >
                  <option value="">Sélectionner</option>
                  {regions.map((region) => (
                    <option key={region.name} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Ville <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none z-10" />
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input-field pl-11"
                  required
                  disabled={!formData.region}
                >
                  <option value="">Sélectionner</option>
                  {cities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Adresse Complète */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Adresse Complète <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Quartier, rue, numéro..."
              className="input-field"
              required
            />
          </div>

          {/* Lieu-dit */}
          <div>
            <label className="block text-sm font-medium mb-2">Lieu-dit</label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              placeholder="Point de repère (ex: Face station Tradex, bâtiment bleu)"
              className="input-field"
            />
          </div>
        </div>

        {/* Buttons */}
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
  );
}
