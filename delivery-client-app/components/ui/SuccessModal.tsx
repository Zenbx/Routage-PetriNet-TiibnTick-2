"use client";

import { useState } from "react";
import { CheckCircle, Copy, Check, ArrowRight } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  trackingCode: string;
  onContinue: () => void;
}

export function SuccessModal({ isOpen, trackingCode, onContinue }: SuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background-card border-2 border-primary/20 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
        {/* Icône de succès */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-bounce-once">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-3xl font-bold text-center text-white mb-2">
          Livraison créée !
        </h2>
        <p className="text-center text-text-muted mb-6">
          Votre colis a été enregistré avec succès
        </p>

        {/* Code de tracking */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-text-muted mb-2 text-center">
            Code de suivi
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative bg-background-card border border-primary/30 rounded-xl p-4 flex items-center justify-between">
              <code className="text-2xl font-mono font-bold text-primary tracking-wider">
                {trackingCode}
              </code>
              <button
                onClick={handleCopy}
                className="ml-4 p-2 hover:bg-primary/10 rounded-lg transition-colors"
                title="Copier le code"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-primary" />
                ) : (
                  <Copy className="w-5 h-5 text-text-muted hover:text-primary" />
                )}
              </button>
            </div>
          </div>
          {copied && (
            <p className="text-center text-primary text-sm mt-2 animate-fade-in">
              ✓ Code copié !
            </p>
          )}
        </div>

        {/* Message d'info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-text-muted text-center">
            Conservez ce code pour suivre votre colis en temps réel
          </p>
        </div>

        {/* Bouton continuer */}
        <button
          onClick={onContinue}
          className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
        >
          Suivre mon colis
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
