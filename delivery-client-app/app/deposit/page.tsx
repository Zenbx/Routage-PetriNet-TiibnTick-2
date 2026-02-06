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
import { SuccessModal } from "@/components/ui/SuccessModal";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const steps: Step[] = [
  { id: 1, label: "Expéditeur", icon: <User className="w-5 h-5" /> },
  { id: 2, label: "Destinataire", icon: <MapPin className="w-5 h-5" /> },
  { id: 3, label: "Colis", icon: <Package className="w-5 h-5" /> },
  { id: 4, label: "Trajet", icon: <Route className="w-5 h-5" /> },
  { id: 5, label: "Signature", icon: <Edit3 className="w-5 h-5" /> },
  { id: 6, label: "Paiement", icon: <CreditCard className="w-5 h-5" /> },
];

export default function DepositPage() {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    sender: {},
    recipient: {},
    package: {},
    trajet: {},
    signature: {},
    paiement: {},
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

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
      // Calculer le prix basé sur la distance et le poids
      const distance = completeData.trajet?.distance || 0;
      const weight = parseFloat(completeData.package.weight) || 1;

      // Formule simple: base 1500 + 100/km + 200/kg
      let calculatedPrice = 1500;
      if (distance > 0) calculatedPrice += distance * 100;
      calculatedPrice += weight * 200;

      // Add options surcharges
      if (completeData.package?.fragile) calculatedPrice += 1200;
      if (completeData.package?.perishable) calculatedPrice += 800;
      if (completeData.package?.liquid) calculatedPrice += 500;
      if (completeData.package?.homePickup) calculatedPrice += 1000;
      if (completeData.package?.homeDelivery) calculatedPrice += 1000;

      // Préparer les données pour l'API (structure imbriquée attendue par le backend)
      const deliveryRequest = {
        sender: {
          name: completeData.sender.name,
          phone: completeData.sender.phone,
          address: completeData.sender.address,
          landmark: completeData.sender.landmark,
          pickupType: (completeData.package.homePickup ? "HOME" : "RELAY_POINT") as "HOME" | "RELAY_POINT",
          pickupLocationId: completeData.package.homePickup
            ? (completeData.sender.latitude ? `${completeData.sender.latitude},${completeData.sender.longitude}` : `${completeData.sender.city}_HOME`)
            : `RELAY_${completeData.sender.city}`,
        },
        recipient: {
          name: completeData.recipient.name,
          phone: completeData.recipient.phone,
          address: completeData.recipient.address,
          landmark: completeData.recipient.landmark,
          deliveryType: (completeData.package.homeDelivery ? "HOME" : "RELAY_POINT") as "HOME" | "RELAY_POINT",
          deliveryLocationId: completeData.package.homeDelivery
            ? (completeData.recipient.latitude ? `${completeData.recipient.latitude},${completeData.recipient.longitude}` : `${completeData.recipient.city}_HOME`)
            : `RELAY_${completeData.recipient.city}`,
        },
        package_: {
          description: completeData.package.designation || "Colis",
          weight: weight,
          length: parseFloat(completeData.package.length) || 0,
          width: parseFloat(completeData.package.width) || 0,
          height: parseFloat(completeData.package.height) || 0,
        },
        specialInstructions: completeData.trajet?.notes || "",
        distance: distance,
        price: calculatedPrice,
        preferredDeadline: completeData.trajet?.preferredDate ? `${completeData.trajet.preferredDate}T12:00:00Z` : undefined
      };

      // Appel API
      const response = await api.createDelivery(deliveryRequest);

      // Succès - Afficher la modal
      setTrackingCode(response.trackingCode);
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Votre demande n'a pas pu être aboutie, réessayez dans quelques minutes");
    }
  };

  const handleContinueToTracking = () => {
    // Redirection vers la page de suivi avec le code
    window.location.href = `/tracking?code=${trackingCode}`;
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
              senderData={{
                ...formData.sender,
                pickupType: (formData.package as any).homePickup ? 'HOME' : 'RELAY_POINT'
              }}
              recipientData={{
                ...formData.recipient,
                deliveryType: (formData.package as any).homeDelivery ? 'HOME' : 'RELAY_POINT'
              }}
            />
          )}
          {currentStep === 5 && <SignatureStep onNext={nextStep} onBack={prevStep} />}
          {currentStep === 6 && <PaiementStep onNext={nextStep} onBack={prevStep} />}
        </div>
      </div>

      {/* Modal de succès */}
      <SuccessModal
        isOpen={showSuccessModal}
        trackingCode={trackingCode}
        onContinue={handleContinueToTracking}
      />
    </div>
  );
}
