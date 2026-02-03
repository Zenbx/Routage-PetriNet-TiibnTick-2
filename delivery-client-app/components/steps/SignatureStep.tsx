"use client";

import { useState } from "react";
import { Edit3, Upload, Check } from "lucide-react";

interface SignatureStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function SignatureStep({ onNext, onBack }: SignatureStepProps) {
  const [formData, setFormData] = useState({
    signatureType: "draw",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      alert("Veuillez accepter les conditions et la politique de confidentialité");
      return;
    }
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="card">
        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Edit3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Signature électronique</h2>
            <p className="text-text-muted text-sm">Signez pour valider votre demande</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Type de signature */}
          <div>
            <label className="block text-sm font-medium mb-3">Mode de signature</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, signatureType: "draw" })}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.signatureType === "draw"
                    ? "bg-primary/10 border-primary"
                    : "bg-background-card border-border hover:border-border-light"
                }`}
              >
                <Edit3 className={`w-6 h-6 mb-2 ${formData.signatureType === "draw" ? "text-primary" : "text-text-muted"}`} />
                <div className="font-bold text-sm">Dessiner</div>
                <div className="text-xs text-text-muted mt-1">Dessinez votre signature</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, signatureType: "upload" })}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.signatureType === "upload"
                    ? "bg-primary/10 border-primary"
                    : "bg-background-card border-border hover:border-border-light"
                }`}
              >
                <Upload className={`w-6 h-6 mb-2 ${formData.signatureType === "upload" ? "text-primary" : "text-text-muted"}`} />
                <div className="font-bold text-sm">Télécharger</div>
                <div className="text-xs text-text-muted mt-1">Importez une image</div>
              </button>
            </div>
          </div>

          {/* Zone de signature */}
          <div>
            <label className="block text-sm font-medium mb-2">Votre signature</label>
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center bg-white/5">
              <Edit3 className="w-12 h-12 mx-auto mb-3 text-text-muted" />
              <p className="text-text-muted">
                {formData.signatureType === "draw"
                  ? "Zone de dessin (à implémenter avec canvas)"
                  : "Cliquez pour télécharger votre signature"}
              </p>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-background-light p-6 rounded-xl border border-border space-y-4">
            <h3 className="font-bold text-sm">Acceptation des conditions</h3>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  className="sr-only peer"
                  required
                />
                <div className="w-5 h-5 border-2 border-border rounded peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                  {formData.acceptTerms && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-text">
                  J'accepte les{" "}
                  <a href="#" className="text-primary hover:underline">
                    conditions générales d'utilisation
                  </a>
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.acceptPrivacy}
                  onChange={(e) => setFormData({ ...formData, acceptPrivacy: e.target.checked })}
                  className="sr-only peer"
                  required
                />
                <div className="w-5 h-5 border-2 border-border rounded peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                  {formData.acceptPrivacy && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-text">
                  J'accepte la{" "}
                  <a href="#" className="text-primary hover:underline">
                    politique de confidentialité
                  </a>
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-8">
          <button type="button" onClick={onBack} className="btn-secondary">
            ← Retour
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!formData.acceptTerms || !formData.acceptPrivacy}
          >
            Continuer →
          </button>
        </div>
      </div>
    </form>
  );
}
