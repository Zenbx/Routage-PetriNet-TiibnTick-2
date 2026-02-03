"use client";

import { useState } from "react";
import { User, MapPin, Package, Route, Edit3, CreditCard, ArrowLeft } from "lucide-react";
import { Stepper, type Step } from "@/components/ui/Stepper";
import { SenderStep } from "@/components/steps/SenderStep";
import { RecipientStep } from "@/components/steps/RecipientStep";
import { PackageStep } from "@/components/steps/PackageStep";
import { TrajetStep } from "@/components/steps/TrajetStep";
import { SignatureStep } from "@/components/steps/SignatureStep";
import { PaiementStep } from "@/components/steps/PaiementStep";
import { api } from "@/lib/api";

const steps: Step[] = [
  { id: 1, label: "Expéditeur", icon: <User className="w-5 h-5" /> },
  { id: 2, label: "Destinataire", icon: <MapPin className="w-5 h-5" /> },
  { id: 3, label: "Colis", icon: <Package className="w-5 h-5" /> },
  { id: 4, label: "Trajet", icon: <Route className="w-5 h-5" /> },
  { id: 5, label: "Signature", icon: <Edit3 className="w-5 h-5" /> },
  { id: 6, label: "Paiement", icon: <CreditCard className="w-5 h-5" /> },
];

export default function DepositPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    sender: {},
    recipient: {},
    package: {},
    trajet: {},
    signature: {},
    paiement: {},
  });

  const nextStep = (data: any) => {
    const stepKeys = ["sender", "recipient", "package", "trajet", "signature", "paiement"];
    const currentKey = stepKeys[currentStep - 1];

    setFormData({ ...formData, [currentKey]: data });

    if (currentStep === 6) {
      handleSubmit({ ...formData, paiement: data });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (completeData: any) => {
    console.log("Formulaire complet:", completeData);

    try {
      // Calculer le prix total
      let totalPrice = 0;
      if (completeData.package?.fragile) totalPrice += 1200;
      if (completeData.package?.perishable) totalPrice += 800;
      if (completeData.package?.liquid) totalPrice += 500;
      if (completeData.package?.homePickup) totalPrice += 1000;
      if (completeData.package?.homeDelivery) totalPrice += 1000;

      // Préparer les données pour l'API (structure imbriquée attendue par le backend)
      const deliveryRequest = {
        sender: {
          name: completeData.sender.name,
          phone: completeData.sender.phone,
          address: `${completeData.sender.address}, ${completeData.sender.city}, ${completeData.sender.region}`,
          pickupType: completeData.package.homePickup ? "HOME" : "RELAY_POINT",
          pickupLocationId: completeData.package.homePickup
            ? `${completeData.sender.city}_HOME`
            : `RELAY_${completeData.sender.city}`,
        },
        recipient: {
          name: completeData.recipient.name,
          phone: completeData.recipient.phone,
          address: `${completeData.recipient.address}, ${completeData.recipient.city}, ${completeData.recipient.region}`,
          deliveryType: completeData.package.homeDelivery ? "HOME" : "RELAY_POINT",
          deliveryLocationId: completeData.package.homeDelivery
            ? `${completeData.recipient.city}_HOME`
            : `RELAY_${completeData.recipient.city}`,
        },
        package_: {
          description: completeData.package.designation || "Colis",
          weight: parseFloat(completeData.package.weight) || 1,
          length: parseFloat(completeData.package.length) || 0,
          width: parseFloat(completeData.package.width) || 0,
          height: parseFloat(completeData.package.height) || 0,
        },
        specialInstructions: completeData.trajet?.notes || "",
      };

      // Appel API
      const response = await api.createDelivery(deliveryRequest);

      // Succès
      alert(`Livraison créée avec succès!\nCode de suivi: ${response.trackingCode}\n\nVous pouvez suivre votre colis avec ce code.`);

      // Reset ou redirection
      window.location.href = `/tracking?code=${response.trackingCode}`;

    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      alert(`Erreur: ${error.message || "Une erreur est survenue. Veuillez réessayer."}`);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => window.location.href = "/"}
            className="inline-flex items-center gap-2 text-primary hover:text-primary-light mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>

          <h1 className="text-4xl font-bold text-white mb-2">
            Processus de Dépôt de Colis
          </h1>
          <p className="text-text-muted">
            Suivez les étapes pour expédier votre colis en toute simplicité.
          </p>
        </div>

        {/* Stepper */}
        <Stepper steps={steps} currentStep={currentStep} />

        {/* Content */}
        <div className="mt-12">
          {currentStep === 1 && <SenderStep onNext={nextStep} />}
          {currentStep === 2 && <RecipientStep onNext={nextStep} onBack={prevStep} />}
          {currentStep === 3 && <PackageStep onNext={nextStep} onBack={prevStep} />}
          {currentStep === 4 && (
            <TrajetStep
              onNext={nextStep}
              onBack={prevStep}
              senderData={formData.sender}
              recipientData={formData.recipient}
            />
          )}
          {currentStep === 5 && <SignatureStep onNext={nextStep} onBack={prevStep} />}
          {currentStep === 6 && <PaiementStep onNext={nextStep} onBack={prevStep} />}
        </div>
      </div>
    </div>
  );
}
