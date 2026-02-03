"use client";

import { useState } from "react";
import { CreditCard, Smartphone, DollarSign, Check, ArrowRight } from "lucide-react";

interface PaiementStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function PaiementStep({ onNext, onBack }: PaiementStepProps) {
  const [formData, setFormData] = useState({
    paymentMethod: "mobile",
    phoneNumber: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulation d'envoi à l'API
    setTimeout(() => {
      setIsSubmitting(false);
      onNext(formData);
    }, 2000);
  };

  const totalPrice = 4500; // Prix fictif

  const paymentMethods = [
    { id: "mobile", label: "Mobile Money", icon: Smartphone, providers: ["MTN", "Orange", "Moov"] },
    { id: "card", label: "Carte bancaire", icon: CreditCard },
    { id: "cash", label: "Paiement à la livraison", icon: DollarSign },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Paiement</h2>
                <p className="text-text-muted text-sm">Choisissez votre mode de paiement</p>
              </div>
            </div>

            {/* Méthodes de paiement */}
            <div className="space-y-4 mb-6">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = formData.paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-background-card border-border hover:border-border-light"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${isSelected ? "text-primary" : "text-text-muted"}`} />
                      <div className="flex-1">
                        <div className="font-bold">{method.label}</div>
                        {method.providers && (
                          <div className="text-xs text-text-muted mt-1">
                            {method.providers.join(", ")}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Formulaire selon méthode */}
            {formData.paymentMethod === "mobile" && (
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="font-bold">Informations Mobile Money</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Numéro de téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="699 123 456"
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-text-muted mt-2">
                    Vous recevrez une notification pour valider le paiement
                  </p>
                </div>
              </div>
            )}

            {formData.paymentMethod === "card" && (
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="font-bold">Informations carte bancaire</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Numéro de carte *</label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    placeholder="1234 5678 9012 3456"
                    className="input-field"
                    maxLength={19}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date d'expiration *</label>
                    <input
                      type="text"
                      value={formData.cardExpiry}
                      onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                      placeholder="MM/AA"
                      className="input-field"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CVV *</label>
                    <input
                      type="text"
                      value={formData.cardCVV}
                      onChange={(e) => setFormData({ ...formData, cardCVV: e.target.value })}
                      placeholder="123"
                      className="input-field"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.paymentMethod === "cash" && (
              <div className="border-t border-border pt-6">
                <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl">
                  <p className="text-sm">
                    <strong className="text-primary">Paiement à la livraison :</strong> Vous paierez le montant directement au livreur lors de la réception du colis.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Résumé (1/3) */}
        <div>
          <div className="card border-2 border-primary/30 sticky top-6">
            <h3 className="font-bold text-lg mb-4">Récapitulatif</h3>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-text-muted">Frais de base</span>
                <span className="font-medium">2 500 FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Options spéciales</span>
                <span className="font-medium">1 200 FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Services additionnels</span>
                <span className="font-medium">800 FCFA</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">{totalPrice} FCFA</span>
              </div>
            </div>

            <div className="bg-background-light p-3 rounded-lg mb-6">
              <div className="flex items-start gap-2 text-xs text-text-muted">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p>Votre paiement est sécurisé et crypté</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  Confirmer le paiement
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full btn-secondary mt-3"
              disabled={isSubmitting}
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
