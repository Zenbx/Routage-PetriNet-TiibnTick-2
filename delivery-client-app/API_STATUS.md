# État des connexions API

## ✅ Complètement connecté à l'API

### Pages Client
- ✅ **[/deposit](app/deposit/page.tsx)** - Crée vraiment les livraisons via `api.createDelivery()`
- ✅ **[/tracking](app/tracking/page.tsx)** - Affiche vraies données via `api.trackDelivery()`

### Pages Driver
- ✅ **[/driver/dashboard](app/driver/dashboard/page.tsx)** - Récupère livraisons disponibles et actives via API
  - `api.getAllDeliveries({ status: 'PENDING' })` pour disponibles
  - `api.getAllDeliveries({ status: 'ACCEPTED,PICKED_UP,IN_TRANSIT,DELIVERED' })` pour actives
  - `api.assignDriver()` + `api.updateDeliveryStatus()` pour accepter

## ⚠️ Avec données mockées (à connecter)

### Pages Driver
- ⚠️ **[/driver/deliveries/[id]](app/driver/deliveries/[id]/page.tsx)** - Détails livraison
  ```typescript
  // À ajouter:
  useEffect(() => {
    const fetchDelivery = async () => {
      const data = await api.getDelivery(deliveryId);
      setDelivery(data);
    };
    fetchDelivery();
  }, [deliveryId]);

  const handleStatusUpdate = async (newStatus) => {
    await api.updateDeliveryStatus(deliveryId, newStatus);
    if (newStatus === 'IN_TRANSIT') {
      // Démarrer GPS tracking avec Kalman
      startGPSTracking();
    }
  };
  ```

### Pages Admin
- ⚠️ **[/admin/dashboard](app/admin/dashboard/page.tsx)** - Dashboard monitoring
  ```typescript
  // À ajouter:
  useEffect(() => {
    const fetchData = async () => {
      const allDeliveries = await api.getAllDeliveries();
      const tourData = await api.getAllTours({ status: 'ACTIVE' });
      setTours(tourData || []);
      setStats({
        activeTours: tourData?.length || 0,
        totalDeliveries: allDeliveries?.length || 0,
        completedToday: allDeliveries?.filter(d => d.status === 'DELIVERED').length || 0,
        pendingDeliveries: allDeliveries?.filter(d => d.status === 'PENDING').length || 0,
      });
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);
  ```

- ⚠️ **[/admin/tours/[id]](app/admin/tours/[id]/page.tsx)** - Détails tournée
  ```typescript
  // À ajouter:
  useEffect(() => {
    const fetchTour = async () => {
      const data = await api.getTour(tourId);
      setTour(data);
    };
    fetchTour();

    // WebSocket pour temps réel
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.tourId === tourId) {
        setTour(prev => ({ ...prev, ...update }));
      }
    };
    return () => ws.close();
  }, [tourId]);
  ```

- ⚠️ **[/admin/deliveries](app/admin/deliveries/page.tsx)** - Gestion livraisons
  ```typescript
  // À ajouter:
  useEffect(() => {
    const fetchDeliveries = async () => {
      const data = await api.getAllDeliveries(filters);
      setDeliveries(data);
    };
    fetchDeliveries();
  }, [filters]);
  ```

- ⚠️ **[/admin/drivers](app/admin/drivers/page.tsx)** - Gestion livreurs
  ```typescript
  // À ajouter:
  useEffect(() => {
    const fetchDrivers = async () => {
      const data = await api.getAvailableDrivers();
      setDrivers(data);
    };
    fetchDrivers();
  }, []);
  ```

## 🔐 Pages d'authentification (simulation OK)
- ✅ **[/driver/login](app/driver/login/page.tsx)** - Simule connexion (à connecter JWT plus tard)
- ✅ **[/admin/login](app/admin/login/page.tsx)** - Simule connexion (à connecter JWT plus tard)

## 📝 Prochaines étapes

### 1. Priorité HAUTE - Fonctionnalités essentielles marchent
Les pages essentielles sont connectées:
- ✅ Créer une livraison (deposit)
- ✅ Suivre une livraison (tracking)
- ✅ Driver peut voir et accepter des livraisons

### 2. Priorité MOYENNE - Connecter les pages restantes
Suivre les exemples de code ci-dessus pour:
- Driver delivery details
- Admin dashboard
- Admin tours/deliveries/drivers

### 3. Priorité BASSE - Améliorations
- Authentification JWT
- WebSocket temps réel
- GPS tracking avec Kalman
- Notifications push

## 🚀 Déployer maintenant

Les fonctionnalités critiques marchent! Tu peux déployer sur Vercel:

1. Les clients peuvent créer des livraisons ✅
2. Les clients peuvent suivre leurs colis ✅
3. Les drivers peuvent voir et accepter des livraisons ✅

Les autres pages afficheront des données mockées mais ne casseront pas l'application.

### Variables Vercel
```env
NEXT_PUBLIC_API_URL=https://tiibntick-delivery-api-production-1285.up.railway.app/api
NEXT_PUBLIC_WS_URL=wss://tiibntick-delivery-api-production-1285.up.railway.app/ws
NEXT_PUBLIC_APP_NAME=TiiBnTicK
```

## 📊 Backend Ready

L'API Railway expose tous ces endpoints:
- ✅ POST /api/deliveries - Créer (UTILISÉ)
- ✅ GET /api/tracking/{code} - Suivre (UTILISÉ)
- ✅ GET /api/deliveries - Liste (UTILISÉ)
- ✅ PUT /api/deliveries/{id}/status - Statut (UTILISÉ)
- ✅ POST /api/deliveries/{id}/assign - Assigner (UTILISÉ)
- ⏳ GET /api/tours/{id} - Détails tournée
- ⏳ POST /api/routing/calculate - Routes
- ⏳ POST /api/vrp/optimize - VRP
- ⏳ POST /api/tracking/kalman/update - Kalman
- ⏳ GET /api/tracking/{id}/eta - ETA

Tout est prêt côté backend, il suffit de connecter les pages restantes quand tu veux!
