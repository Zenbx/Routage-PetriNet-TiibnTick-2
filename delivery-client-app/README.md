# TIIBNTICK - Application Client

Application web pour le dépôt de colis avec le style TIIBNTICK (orange/noir).

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env.local` :

```
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app
```

## Lancer en développement

```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3001](http://localhost:3001)

## Build production

```bash
npm run build
npm start
```

## Fonctionnalités

- ✅ Processus de dépôt en 6 étapes avec stepper
- ✅ Étape Expéditeur (informations complètes)
- ✅ Étape Destinataire
- ✅ Étape Colis (photo, dimensions, poids)
- 🔄 Étape Trajet (à implémenter)
- 🔄 Étape Signature (à implémenter)
- 🔄 Étape Paiement (à implémenter)
- 🔄 Page de tracking public (à implémenter)

## Style

- Fond: #1a1d2e (bleu-noir foncé)
- Accent: #ff6b35 (orange vif)
- Police: Inter
- Design: Moderne, épuré, professionnel
