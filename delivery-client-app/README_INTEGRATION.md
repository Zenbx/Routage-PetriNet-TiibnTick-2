# TIIBNTICK - Guide d'intégration Frontend-Backend

## Architecture complète

### Frontend (Next.js 14)
- **Client App**: Dépôt de colis et suivi
- **Driver App**: Interface livreur pour gérer les livraisons
- **Admin App**: Tableau de bord de gestion et monitoring en temps réel

### Backend (Spring Boot WebFlux)
- **API REST**: Gestion des livraisons, livreurs, routes
- **VRP Solver**: Optimisation des tournées
- **Kalman Filter**: Tracking en temps réel et calcul d'ETA
- **Petri Net**: Gestion des états des livraisons
- **GraphQL**: Requêtes flexibles pour les graphes de livraison

## Intégration API

### 1. Configuration

Créer un fichier `.env.local` basé sur `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Variables d'environnement:
- `NEXT_PUBLIC_API_URL`: URL de l'API backend (Railway: déjà configurée)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Clé API Google Maps pour les cartes

### 2. Service API ([lib/api.ts](lib/api.ts))

Le service API centralisé gère toutes les requêtes:

#### Livraisons
```typescript
// Créer une livraison
await api.createDelivery(deliveryData);

// Suivre une livraison
await api.trackDelivery(trackingCode);

// Mettre à jour le statut
await api.updateDeliveryStatus(deliveryId, status, location);
```

#### Routing et Optimisation
```typescript
// Calculer une route
await api.calculateRoute({ origin, destination });

// Optimiser une tournée VRP
await api.optimizeVRP({ deliveries, drivers });
```

#### Tracking en temps réel (Kalman Filter)
```typescript
// Mettre à jour la position
await api.updateLocationKalman({
  deliveryId,
  currentLocation,
  timestamp,
  speed
});

// Obtenir l'ETA mis à jour
await api.getETA(deliveryId);
```

### 3. Intégration par page

#### Page de dépôt ([app/deposit/page.tsx](app/deposit/page.tsx:52))

Remplacer le `handleSubmit` simulé par:

```typescript
const handleSubmit = async (completeData: any) => {
  try {
    setIsLoading(true);

    // Transformer les données du formulaire
    const deliveryRequest: DeliveryRequest = {
      // Sender
      senderName: completeData.sender.name,
      senderPhone: completeData.sender.phone,
      senderEmail: completeData.sender.email,
      senderAddress: completeData.sender.address,
      senderCity: completeData.sender.city,
      senderRegion: completeData.sender.region,
      senderCountry: completeData.sender.country,
      senderLandmark: completeData.sender.landmark,

      // Recipient
      recipientName: completeData.recipient.name,
      recipientPhone: completeData.recipient.phone,
      // ... même structure pour recipient

      // Package
      packageDescription: completeData.package.description,
      packageWeight: completeData.package.weight,
      isFragile: completeData.package.fragile,
      isPerishable: completeData.package.perishable,
      // ...

      // Route et prix
      price: calculateTotalPrice(completeData),
      paymentMethod: completeData.paiement.method,
    };

    // Appel API
    const response = await api.createDelivery(deliveryRequest);

    // Redirection vers la page de confirmation
    router.push(`/confirmation?tracking=${response.trackingCode}`);
  } catch (error) {
    console.error("Erreur lors de la création:", error);
    alert("Erreur lors de la soumission. Veuillez réessayer.");
  } finally {
    setIsLoading(false);
  }
};
```

#### Page de tracking ([app/tracking/page.tsx](app/tracking/page.tsx))

Intégrer l'API de tracking:

```typescript
const handleTrack = async () => {
  try {
    setIsLoading(true);
    const data = await api.trackDelivery(trackingCode);
    setTrackingData(data);
  } catch (error) {
    setError("Code de suivi invalide ou livraison introuvable");
  } finally {
    setIsLoading(false);
  }
};
```

#### Dashboard livreur ([app/driver/dashboard/page.tsx](app/driver/dashboard/page.tsx))

```typescript
// Récupérer les livraisons disponibles
useEffect(() => {
  const fetchDeliveries = async () => {
    const available = await api.getAllDeliveries({ status: 'PENDING' });
    setAvailableDeliveries(available);

    const active = await api.getDriverDeliveries(driverId);
    setActiveDeliveries(active);
  };

  fetchDeliveries();
}, []);

// Accepter une livraison
const handleAcceptDelivery = async (deliveryId: string) => {
  await api.assignDriver(deliveryId, driverId);
  await api.updateDeliveryStatus(deliveryId, 'ACCEPTED');
  // Rafraîchir la liste
};
```

#### Page détails livraison ([app/driver/deliveries/[id]/page.tsx](app/driver/deliveries/[id]/page.tsx))

```typescript
// Mettre à jour le statut
const handleStatusUpdate = async (newStatus: string) => {
  await api.updateDeliveryStatus(deliveryId, newStatus);

  // Si en transit, activer le tracking Kalman
  if (newStatus === 'IN_TRANSIT') {
    startLocationTracking();
  }
};

// Tracking GPS en temps réel
const startLocationTracking = () => {
  const interval = setInterval(async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Mettre à jour avec Kalman Filter
        const result = await api.updateLocationKalman({
          deliveryId,
          currentLocation: location,
          timestamp: new Date().toISOString(),
          speed: position.coords.speed || undefined,
        });

        // Afficher l'ETA mis à jour
        setETA(result.estimatedArrival);
      });
    }
  }, 10000); // Toutes les 10 secondes

  return () => clearInterval(interval);
};
```

#### Dashboard admin ([app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx))

```typescript
// Récupérer toutes les tournées actives
useEffect(() => {
  const fetchTours = async () => {
    const tours = await api.getAllTours({ status: 'ACTIVE' });
    setTours(tours);
  };

  // Auto-refresh toutes les 30 secondes
  fetchTours();
  const interval = setInterval(fetchTours, 30000);
  return () => clearInterval(interval);
}, []);
```

#### Détails tournée admin ([app/admin/tours/[id]/page.tsx](app/admin/tours/[id]/page.tsx))

```typescript
// Récupérer les détails de la tournée
useEffect(() => {
  const fetchTourDetails = async () => {
    const tour = await api.getTour(tourId);
    setTour(tour);

    // Récupérer l'optimisation VRP
    const optimization = await api.getTourOptimization(tourId);
    setOptimization(optimization);
  };

  fetchTourDetails();

  // WebSocket pour updates en temps réel
  const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    if (update.tourId === tourId) {
      updateTourState(update);
    }
  };

  return () => ws.close();
}, [tourId]);
```

### 4. Fonctionnalités clés à implémenter

#### A. Calcul de route avec backend

```typescript
// Dans TrajetStep.tsx
const calculateRoute = async (origin: string, destination: string) => {
  const originLocation = await geocode(origin); // Utiliser Google Maps Geocoding
  const destLocation = await geocode(destination);

  const route = await api.calculateRoute({
    origin: originLocation,
    destination: destLocation,
  });

  setDistance(route.distance);
  setDuration(route.duration);
  setETA(route.eta);
};
```

#### B. Optimisation VRP pour les tournées

```typescript
// Fonction admin pour optimiser les tournées
const optimizeDailyTours = async () => {
  const pendingDeliveries = await api.getAllDeliveries({ status: 'PENDING' });
  const availableDrivers = await api.getAvailableDrivers();

  const vrpResult = await api.optimizeVRP({
    deliveries: pendingDeliveries.map(d => ({
      id: d.id,
      pickupLocation: d.pickupLocation,
      deliveryLocation: d.deliveryLocation,
      priority: d.priority,
    })),
    drivers: availableDrivers.map(d => ({
      id: d.id,
      currentLocation: d.location,
      vehicleCapacity: d.capacity,
    })),
  });

  // Créer les tournées optimisées
  for (const tour of vrpResult.tours) {
    await api.createTour({
      driverId: tour.driverId,
      deliveryIds: tour.deliverySequence,
    });
  }
};
```

#### C. Affichage ETA en temps réel

```typescript
// Component pour afficher l'ETA avec confiance
function ETADisplay({ deliveryId }: { deliveryId: string }) {
  const [eta, setETA] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    const updateETA = async () => {
      const result = await api.getETA(deliveryId);
      setETA(result.eta);
      setConfidence(result.confidence);
    };

    updateETA();
    const interval = setInterval(updateETA, 30000);
    return () => clearInterval(interval);
  }, [deliveryId]);

  return (
    <div>
      <p>ETA: {eta}</p>
      <p>Confiance: {(confidence * 100).toFixed(0)}%</p>
    </div>
  );
}
```

### 5. Gestion des états avec Petri Net

```typescript
// Transitions disponibles selon le Petri Net
const transitions = {
  PENDING: ['accept', 'cancel'],
  ACCEPTED: ['pickup', 'cancel'],
  PICKED_UP: ['start_delivery'],
  IN_TRANSIT: ['deliver', 'return'],
  DELIVERED: [],
  CANCELLED: [],
};

// Fire une transition
const changeDeliveryState = async (deliveryId: string, transition: string) => {
  await api.fireTransition(deliveryId, transition);

  // Récupérer le nouvel état
  const newState = await api.getDeliveryState(deliveryId);
  updateDeliveryUI(newState);
};
```

### 6. WebSocket pour updates en temps réel

```typescript
// lib/websocket.ts
export class RealtimeService {
  private ws: WebSocket | null = null;

  connect(onUpdate: (data: any) => void) {
    this.ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  subscribe(deliveryId: string) {
    this.ws?.send(JSON.stringify({
      type: 'subscribe',
      deliveryId,
    }));
  }

  disconnect() {
    this.ws?.close();
  }
}
```

## Points importants

1. **Calcul de routes**: Le backend utilise l'optimisation VRP pour calculer les routes optimales
2. **ETA dynamique**: Le filtre de Kalman recalcule l'ETA en fonction des positions GPS réelles
3. **Gestion d'états**: Le Petri Net assure que les transitions d'états sont valides
4. **Optimisation en temps réel**: Les tournées sont recalculées si des livraisons sont ajoutées/annulées
5. **Tracking GPS**: Les positions des livreurs sont mises à jour en temps réel

## Prochaines étapes

1. Créer les pages de confirmation après dépôt
2. Intégrer Google Maps pour l'affichage des cartes
3. Implémenter le système de notifications (push/email)
4. Ajouter l'authentification JWT pour sécuriser les endpoints
5. Implémenter le paiement mobile (Mobile Money)
6. Ajouter des tests unitaires et E2E

## Endpoints backend principaux

- `POST /api/deliveries` - Créer une livraison
- `GET /api/tracking/{code}` - Suivre une livraison
- `POST /api/routing/calculate` - Calculer une route
- `POST /api/vrp/optimize` - Optimiser les tournées
- `POST /api/tracking/kalman/update` - Mettre à jour position Kalman
- `GET /api/tracking/{id}/eta` - Obtenir l'ETA
- `POST /api/petri-net/fire` - Changer l'état d'une livraison
- `GET /api/tours/{id}` - Détails d'une tournée
- `GET /api/drivers/available` - Livreurs disponibles

Voilà! Le frontend est maintenant prêt à être intégré avec votre backend sur Railway.
