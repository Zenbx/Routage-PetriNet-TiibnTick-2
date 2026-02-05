"use client";

import { Package, Search, ArrowRight, MapPin, Clock, Shield } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container-custom py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="text-primary font-bold text-sm uppercase tracking-widest">
              LA SUITE TIIBNTICK
            </span>
          </div>
          <h1 className="text-6xl font-bold text-white mb-6">
            Découvrez nos solutions
          </h1>
          <p className="text-text-muted text-xl mb-12 max-w-2xl mx-auto">
            Expédiez et suivez vos colis en toute simplicité avec TiiB<span className="text-primary">n</span>TicK
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/deposit"
              className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              <Package className="w-5 h-5" />
              Envoyer un colis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tracking"
              className="btn-secondary flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              <Search className="w-5 h-5" />
              Suivre mon colis
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <FeatureCard
            icon={<MapPin className="w-8 h-8" />}
            title="Cameroun & Nigeria"
            description="Livraison dans toutes les régions du Cameroun et du Nigeria"
          />
          <Link href="/tracking">
            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Suivi en temps réel"
              description="Suivez votre colis à chaque étape avec votre code de tracking"
            />
          </Link>
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Sécurisé et fiable"
            description="Vos colis sont assurés et livrés en toute sécurité"
          />
        </div>

        {/* Portal Links */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Driver Portal */}
          <div className="p-[2px] rounded-2xl bg-gradient-to-r from-primary to-primary-dark">
            <div className="bg-background rounded-2xl px-8 py-6 text-center">
              <p className="text-text-muted mb-3">Vous êtes livreur ?</p>
              <Link
                href="/driver/login"
                className="text-primary hover:text-primary-light font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Espace Livreur
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Admin Portal */}
          <div className="p-[2px] rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700">
            <div className="bg-background rounded-2xl px-8 py-6 text-center">
              <p className="text-text-muted mb-3">Administrateur ?</p>
              <Link
                href="/admin/login"
                className="text-blue-500 hover:text-blue-400 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Espace Admin
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card text-center p-8 hover:border-primary transition-all">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-text-muted text-sm">{description}</p>
    </div>
  );
}
