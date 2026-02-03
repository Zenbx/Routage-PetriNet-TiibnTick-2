# Guide de Déploiement - TiiBnTicK

## ✅ État actuel

### Pages connectées à l'API Railway
- ✅ **Deposit Form** ([app/deposit/page.tsx](app/deposit/page.tsx)) - Appelle `api.createDelivery()`
- ✅ **Tracking Page** ([app/tracking/page.tsx](app/tracking/page.tsx)) - Appelle `api.trackDelivery()`

### Pages avec données mockées (à connecter)
- ⚠️ Driver Dashboard ([app/driver/dashboard/page.tsx](app/driver/dashboard/page.tsx:36))
- ⚠️ Driver Delivery Details ([app/driver/deliveries/[id]/page.tsx](app/driver/deliveries/[id]/page.tsx))
- ⚠️ Admin Dashboard ([app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx))
- ⚠️ Admin Tours ([app/admin/tours/[id]/page.tsx](app/admin/tours/[id]/page.tsx))
- ⚠️ Admin Deliveries ([app/admin/deliveries/page.tsx](app/admin/deliveries/page.tsx))
- ⚠️ Admin Drivers ([app/admin/drivers/page.tsx](app/admin/drivers/page.tsx))

## 🚀 Déploiement sur Vercel

### 1. Préparer le déploiement

```bash
# Créer .env.local
cp .env.local.example .env.local
```

### 2. Variables d'environnement Vercel

Dans Vercel Dashboard, ajouter:

```env
NEXT_PUBLIC_API_URL=https://tiibntick-delivery-api-production-1285.up.railway.app/api
NEXT_PUBLIC_WS_URL=wss://tiibntick-delivery-api-production-1285.up.railway.app/ws
NEXT_PUBLIC_APP_NAME=TiiBnTicK
```

### 3. Déployer

```bash
# Via Vercel CLI
vercel

# Ou via GitHub
# 1. Push sur GitHub
# 2. Connecter le repo dans Vercel Dashboard
# 3. Deploy automatique
```

## 🔌 Connecter les pages restantes

### Driver Dashboard

Dans `app/driver/dashboard/page.tsx`:

```typescript
import { useEffect } from "react";
import { api } from "@/lib/api";

// Remplacer les données mockées par:
const [availableDeliveries, setAvailableDeliveries] = useState([]);
const [activeDeliveries, setActiveDeliveries] = useState([]);

useEffect(() => {
  const fetchDeliveries = async () => {
    try {
      // Livraisons disponibles
      const available = await api.getAllDeliveries({ status: 'PENDING' });
      setAvailableDeliveries(available);

      // Livraisons actives du driver (utiliser l'ID du driver connecté)
      const driverId = "driver-id"; // À récupérer du contexte auth
      const active = await api.getDriverDeliveries(driverId);
      setActiveDeliveries(active);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  fetchDeliveries();
  // Rafraîchir toutes les 30 secondes
  const interval = setInterval(fetchDeliveries, 30000);
  return () => clearInterval(interval);
}, []);

// Accepter une livraison
const handleAcceptDelivery = async (deliveryId: string) => {
  try {
    const driverId = "driver-id"; // ID du driver connecté
    await api.assignDriver(deliveryId, driverId);
    await api.updateDeliveryStatus(deliveryId, 'ACCEPTED');
    // Rafraîchir la liste
    fetchDeliveries();
  } catch (error) {
    alert("Erreur lors de l'acceptation");
  }
};
```

### Driver Delivery Details

Dans `app/driver/deliveries/[id]/page.tsx`:

```typescript
const [delivery, setDelivery] = useState(null);

useEffect(() => {
  const fetchDelivery = async () => {
    const data = await api.getDelivery(deliveryId);
    setDelivery(data);
  };
  fetchDelivery();
}, [deliveryId]);

// Mettre à jour le statut
const handleStatusUpdate = async (newStatus) => {
  await api.updateDeliveryStatus(deliveryId, newStatus);

  // Si en transit, démarrer le tracking GPS
  if (newStatus === 'IN_TRANSIT') {
    startGPSTracking();
  }
};

// Tracking GPS avec Kalman Filter
const startGPSTracking = () => {
  const interval = setInterval(async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const result = await api.updateLocationKalman({
          deliveryId,
          currentLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          timestamp: new Date().toISOString(),
          speed: position.coords.speed || undefined,
        });

        // Mettre à jour l'ETA affiché
        setETA(result.estimatedArrival);
      });
    }
  }, 10000); // Toutes les 10 secondes

  return () => clearInterval(interval);
};
```

### Admin Dashboard

Dans `app/admin/dashboard/page.tsx`:

```typescript
const [tours, setTours] = useState([]);
const [stats, setStats] = useState({});

useEffect(() => {
  const fetchData = async () => {
    // Toutes les tournées actives
    const toursData = await api.getAllTours({ status: 'ACTIVE' });
    setTours(toursData);

    // Statistiques
    const deliveries = await api.getAllDeliveries();
    setStats({
      activeTours: toursData.length,
      totalDeliveries: deliveries.length,
      // ... calculer les autres stats
    });
  };

  fetchData();
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, []);
```

### Admin Tour Details avec Map

Dans `app/admin/tours/[id]/page.tsx`:

```typescript
import { Map } from '@/components/Map';

const [tour, setTour] = useState(null);

useEffect(() => {
  const fetchTour = async () => {
    const data = await api.getTour(tourId);
    setTour(data);
  };

  fetchTour();

  // WebSocket pour updates temps réel
  const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    if (update.tourId === tourId) {
      setTour(prev => ({ ...prev, ...update }));
    }
  };

  return () => ws.close();
}, [tourId]);

// Afficher la carte
{tour && (
  <Map
    markers={[
      {
        lat: tour.currentLocation.lat,
        lng: tour.currentLocation.lng,
        label: "Position livreur",
        type: "driver"
      },
      ...tour.deliveries.map(d => ({
        lat: d.recipientLocation.lat,
        lng: d.recipientLocation.lng,
        label: d.recipientName,
        type: d.status === 'DELIVERED' ? 'origin' : 'destination'
      }))
    ]}
    route={tour.route}
  />
)}
```

## 📝 Points importants

### Authentification (à implémenter)
Les pages driver et admin nécessitent une authentification. Implémenter:
1. JWT tokens du backend
2. Context React pour l'auth
3. Protected routes
4. Redirection si non authentifié

Exemple:
```typescript
// lib/auth.tsx
export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  return { user, token, login };
}
```

### WebSocket pour temps réel
Pour les updates en temps réel (positions livreurs, ETA, etc.):

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
  }

  subscribe(topic: string) {
    this.ws?.send(JSON.stringify({ type: 'subscribe', topic }));
  }
}
```

### Optimisation VRP

Pour créer des tournées optimisées:

```typescript
const optimizeTours = async () => {
  const pendingDeliveries = await api.getAllDeliveries({ status: 'PENDING' });
  const drivers = await api.getAvailableDrivers();

  const result = await api.optimizeVRP({
    deliveries: pendingDeliveries.map(d => ({
      id: d.id,
      pickupLocation: d.pickupLocation,
      deliveryLocation: d.deliveryLocation,
      priority: d.priority || 1,
    })),
    drivers: drivers.map(d => ({
      id: d.id,
      currentLocation: d.location,
      vehicleCapacity: d.capacity,
    })),
  });

  // Créer les tournées optimisées
  for (const tour of result.tours) {
    await api.createTour({
      driverId: tour.driverId,
      deliveryIds: tour.deliverySequence,
    });
  }
};
```

## 🧪 Test avant déploiement

```bash
# Build local
npm run build

# Tester le build
npm start

# Vérifier:
# - Formulaire de dépôt fonctionne
# - Tracking fonctionne
# - Cartes s'affichent (OpenStreetMap)
# - Pas d'erreurs console
```

## 📊 Monitoring après déploiement

1. **Vercel Analytics**: Activer dans le dashboard
2. **Error tracking**: Configurer Sentry (optionnel)
3. **API monitoring**: Vérifier les logs Railway
4. **Performance**: Lighthouse score

## 🔐 Sécurité

1. Ne JAMAIS exposer les clés API dans le code
2. Valider toutes les entrées utilisateur
3. Utiliser HTTPS uniquement
4. Implémenter rate limiting côté API
5. Sanitize les données avant affichage

## 📞 Support

En cas de problème:
1. Vérifier les logs Vercel
2. Vérifier les logs Railway (backend)
3. Tester les endpoints directement avec Postman
4. Vérifier les variables d'environnement

---

**Branding**: TiiB<span style="color: #ff6b35">n</span>TicK (n minuscule en orange #ff6b35)
