# 🎯 Guide Visualisation Petri Net

## Vue d'Ensemble

La nouvelle page **Petri Net** offre une visualisation complète et interactive des réseaux de Petri colorés temporisés (CTPN) qui gèrent les workflows de livraison.

### Accès
**URL**: http://localhost:3000/petri-net

**Navigation**: Cliquez sur l'icône **GitBranch** (branches) dans la sidebar

---

## 🎨 Fonctionnalités Visuelles

### 1. Visualisation du Réseau

Le composant principal affiche graphiquement:

#### **Places (États)** - Cercles
- **PENDING** (En attente) - Gris
- **ASSIGNED** (Assignée) - Bleu
- **IN_TRANSIT** (En transit) - Orange
- **DELIVERED** (Livrée) - Vert (en haut)
- **FAILED** (Échouée) - Rouge (en bas)

#### **Transitions** - Rectangles
- **ASSIGN** : PENDING → ASSIGNED
- **START** : ASSIGNED → IN_TRANSIT
- **COMPLETE** : IN_TRANSIT → DELIVERED
- **FAIL** : IN_TRANSIT → FAILED

#### **Tokens (Jetons)** - Points orange animés
- Représentent les livraisons actives
- S'affichent dans la place correspondant à l'état actuel
- Animés avec effet de pulsation

#### **Arcs (Flèches)**
- Connectent les places aux transitions
- S'animent lors du déclenchement d'une transition
- Couleur orange quand actives

---

## 🎮 Interactions

### Sélectionner une Livraison

1. **Grid de sélection** en haut de la page
2. Cliquez sur une carte de livraison
3. L'état du réseau Petri Net se charge automatiquement

### Déclencher une Transition

**Méthode 1: Clic direct**
- Cliquez sur un rectangle de transition **bleu** (activable)
- Les transitions grises sont désactivées (conditions non remplies)

**Méthode 2: Via l'API Backend**
- La transition met à jour automatiquement le statut de la livraison
- Appelle `StateTransitionService` qui valide avec l'API Petri Net

### Initialiser un Workflow

Bouton **"Initialiser Workflow"**:
- Crée un nouveau réseau Petri Net pour la livraison sélectionnée
- Définit les places, transitions et arcs
- Configure l'état initial (token dans PENDING)

### Auto-Refresh

**Checkbox "Auto-refresh"**:
- Actualise l'état toutes les 3 secondes
- Utile pour voir les changements en temps réel
- Affiche les transitions déclenchées depuis d'autres sources

---

## 📊 État du Moteur

Le panneau de droite affiche:

### Métriques Principales

**Places** - Nombre total d'états dans le réseau

**Tokens Actifs** - Nombre de livraisons en cours

**Temps Réseau** - Horodatage du réseau Petri Net

### État Actuel

Affiche la place où se trouve le token (état actuel de la livraison)

### Marquage Actuel

Liste détaillée de toutes les places avec:
- Nom de la place
- Nombre de tokens
- Indicateur visuel (orange si actif)

### À propos du Moteur

Informations techniques:
- **Type**: CTPN (Colored Timed Petri Net)
- **Workflow**: Delivery Lifecycle Management
- **Validations**: Transitions formelles
- **API**: http://localhost:8081

---

## 🔍 Légende Visuelle

**Place (état)** - Cercle blanc avec bordure
- Bordure grise: vide
- Bordure orange: contient un token

**Transition** - Rectangle
- Bleu: activable (peut être déclenchée)
- Gris: désactivée (conditions non remplies)
- Orange pulsant: en cours d'exécution

**Token** - Point orange animé
- Représente une livraison active dans un état

**Arc** - Ligne avec flèche
- Relie places et transitions
- S'anime en orange lors d'une transition

---

## 🎬 Workflow Typique

### Scénario: Suivre une Livraison

1. **Ouvrir** http://localhost:3000/petri-net

2. **Vérifier** la connexion (badge vert "Connecté")

3. **Sélectionner** une livraison dans le grid

4. **Observer** le token dans la place correspondant au statut actuel

5. **Cliquer** sur une transition activable (bleue)
   - Exemple: Si token dans ASSIGNED, cliquer sur "Démarrer"

6. **Animation**:
   - La transition devient orange et pulse
   - Les arcs s'animent
   - Le token se déplace vers la nouvelle place
   - Toast de confirmation s'affiche

7. **Résultat**:
   - Statut mis à jour dans la base de données
   - Transition validée par l'API Petri Net
   - État actualisé dans l'interface

---

## 🛠️ Architecture Technique

### Frontend → Backend

```
Page Petri Net (React)
    ↓ Click transition
petriNetApi.fireTransition()
    ↓ HTTP POST
delivery-api /api/v1/delivery/{id}/state-transition
    ↓
StateTransitionService
    ↓
PetriNetClient.fireTransition()
    ↓ HTTP POST
petri-api /api/nets/{id}/fire/{transitionId}
    ↓
PetriNetEngine (Java)
    ↓
Validation formelle + Update DB
```

### Flux de Données

1. **Sélection livraison** → `loadNetState(deliveryId)`
2. **Appel API** → `GET /api/nets/{id}`
3. **Réponse** → `NetStateDTO { currentTime, marking }`
4. **Affichage** → Composant SVG avec places/transitions
5. **Interaction** → Click transition
6. **Transition** → `POST /api/v1/delivery/{id}/state-transition`
7. **Mise à jour** → Nouveau statut + reload state

---

## 🎨 Charte Graphique

La page respecte la charte glassmorphique:

### Couleurs
- **Background**: Gradient slate → blue → purple
- **Modules**: Blanc translucide avec backdrop-blur
- **Bordures**: Blanc 60% opacité
- **Ombres**: Noires 10% opacité

### Effets
- **Glassmorphism**: `backdrop-blur-2xl bg-white/40`
- **Borders**: `border border-white/60`
- **Shadows**: `shadow-2xl shadow-black/10`
- **Animations**: Pulse, transitions smooth

### Typographie
- **Titres**: Font extrabold, Slate 800
- **Labels**: Font semibold, uppercase tracking-wider
- **Corps**: Font medium, Slate 600-700

---

## 🔧 Configuration

### Variables d'Environnement

[.env.local:5-6](f:\Projet Réseau\delivery-optimization-frontend\.env.local#L5-L6)
```
NEXT_PUBLIC_PETRI_NET_API_URL=http://127.0.0.1:8081
```

### Fichiers Clés

**Types**: [src/types/petri-net.ts](f:\Projet Réseau\delivery-optimization-frontend\src\types\petri-net.ts)
- Interfaces TypeScript correspondant aux DTOs Java

**API Client**: [src/lib/api/petri-net.ts](f:\Projet Réseau\delivery-optimization-frontend\src\lib\api\petri-net.ts)
- Wrapper pour communiquer avec petri-api
- Gestion d'erreurs et logging

**Composants**:
- [src/components/petri-net/PetriNetVisualization.tsx](f:\Projet Réseau\delivery-optimization-frontend\src\components\petri-net\PetriNetVisualization.tsx) - Visualisation SVG
- [src/components/petri-net/EngineState.tsx](f:\Projet Réseau\delivery-optimization-frontend\src\components\petri-net\EngineState.tsx) - État du moteur

**Page**: [src/app/petri-net/page.tsx](f:\Projet Réseau\delivery-optimization-frontend\src\app\petri-net\page.tsx)

---

## 🐛 Troubleshooting

### Problème: Badge "Déconnecté" rouge

**Cause**: API Petri Net (port 8081) non démarrée

**Solution**:
```bash
cd "f:\Projet Réseau\API-PETRI-NET"
.\mvnw spring-boot:run
```

Vérifier: http://localhost:8081/api/nets/health

### Problème: Pas de livraisons dans le grid

**Cause**: delivery-api non démarrée ou pas de données

**Solution**:
1. Vérifier delivery-api: http://localhost:8080/api/v1/delivery
2. Insérer des données de test via Liquibase

### Problème: Transition ne se déclenche pas

**Causes possibles**:
1. **Transition désactivée** (rectangle gris)
   - Le token n'est pas dans la place source
   - Sélectionnez une livraison dans le bon état

2. **Erreur API**
   - Vérifier console navigateur (F12)
   - Vérifier logs backend

3. **Réseau Petri Net non initialisé**
   - Cliquer "Initialiser Workflow"

### Problème: Animation bloquée

**Solution**: Rafraîchir la page ou cliquer "Rafraîchir"

---

## 🎓 Comprendre les Réseaux de Petri

### Concepts Clés

**Place** = État possible
- Exemple: PENDING, IN_TRANSIT, DELIVERED

**Token** = Instance d'objet dans un état
- Exemple: Livraison #123 est dans IN_TRANSIT

**Transition** = Règle de changement d'état
- Exemple: START fait passer de ASSIGNED à IN_TRANSIT

**Arc** = Connexion entre places et transitions
- Définit les flux possibles

### Validation Formelle

Le réseau de Petri garantit:
- ✅ **Cohérence**: Impossible d'avoir un token dans deux places
- ✅ **Validation**: Transitions seulement si conditions remplies
- ✅ **Traçabilité**: Historique complet des transitions
- ✅ **Concurrence**: Gestion correcte des conflits

---

## 📚 Références

### Documentation API

**Petri Net Controller**:
- `POST /api/nets` - Créer réseau
- `GET /api/nets/{id}` - Obtenir état
- `POST /api/nets/{id}/fire/{transitionId}` - Déclencher transition

### Code Backend

**StateTransitionService** [src/main/java/com/delivery/optimization/service/StateTransitionService.java:39](f:\Projet Réseau\delivery-optimization-api\src\main\java\com\delivery\optimization\service\StateTransitionService.java#L39)
```java
public Mono<Delivery> transitionState(String deliveryId, String newStatus, Instant timestamp)
```

**PetriNetClient** [src/main/java/com/delivery/optimization/service/PetriNetClient.java:47](f:\Projet Réseau\delivery-optimization-api\src\main\java\com\delivery\optimization\service\PetriNetClient.java#L47)
```java
public Mono<Void> fireTransition(String deliveryId, String transitionId)
```

---

## ✨ Améliorations Futures

### Court Terme
- [ ] Historique des transitions déclenchées
- [ ] Export du réseau en PNG/SVG
- [ ] Mode édition pour créer des réseaux custom

### Moyen Terme
- [ ] Métriques de performance des transitions
- [ ] Simulation de scénarios "what-if"
- [ ] Visualisation 3D avec Three.js

### Long Terme
- [ ] Réseaux de Petri hiérarchiques
- [ ] Analyse de l'accessibilité (reachability)
- [ ] Model checking automatique

---

## 🎉 Félicitations!

Vous disposez maintenant d'une **visualisation complète et interactive** des réseaux de Petri qui gèrent vos workflows de livraison!

**Prochaine étape**: Testez avec des livraisons réelles et observez les transitions en temps réel.
