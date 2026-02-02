/**
 * Utilitaire de simulation réaliste pour la démo
 * Simule des camions qui ralentissent/accélèrent selon les contraintes des arcs
 */

export interface Arc {
  id: number;
  originId: string;
  destinationId: string;
  distance: number;
  travelTime?: number;
  penibility?: number;
  weatherImpact?: number;
  trafficFactor?: number;
}

export interface PathNode {
  nodeId: string;
  latitude: number;
  longitude: number;
}

export interface DeliveryPath {
  nodes: PathNode[];
  totalDistance: number; // en mètres
}

/**
 * Calcule le facteur de ralentissement d'un arc basé sur ses contraintes
 * @returns Facteur >= 1.0 (1.0 = vitesse normale, 2.0 = 2x plus lent)
 */
export function calculateArcSlowdownFactor(arc: Arc): number {
  const traffic = (arc.trafficFactor != null && arc.trafficFactor > 1.0)
    ? arc.trafficFactor
    : 1.0;

  const penibility = (arc.penibility != null && arc.penibility > 0)
    ? (1.0 + arc.penibility * 0.1)
    : 1.0;

  const weather = (arc.weatherImpact != null && arc.weatherImpact > 0)
    ? (1.0 + arc.weatherImpact * 0.15)
    : 1.0;

  // Facteur combiné: trafic × pénibilité × météo
  return traffic * penibility * weather;
}

/**
 * Trouve l'arc correspondant à un segment du chemin
 */
export function findArcForSegment(
  originId: string,
  destinationId: string,
  allArcs: Arc[]
): Arc | null {
  return allArcs.find(
    arc => arc.originId === originId && arc.destinationId === destinationId
  ) || null;
}

/**
 * Calcule la progression réaliste d'un camion sur son chemin
 *
 * @param currentProgress Progression actuelle (0.0 à 1.0)
 * @param path Chemin planifié (liste de nœuds)
 * @param allArcs Tous les arcs du réseau
 * @param baseSpeed Vitesse de base du camion en km/h (ex: 50)
 * @param deltaTimeSeconds Temps écoulé depuis la dernière mise à jour en secondes
 * @returns Nouvelle progression (0.0 à 1.0)
 */
export function calculateRealisticProgress(
  currentProgress: number,
  path: PathNode[],
  allArcs: Arc[],
  baseSpeed: number,
  deltaTimeSeconds: number
): number {
  if (path.length < 2) {
    return currentProgress;
  }

  // Calculer la distance totale du chemin
  const totalDistance = calculatePathDistance(path, allArcs);
  if (totalDistance === 0) {
    return currentProgress;
  }

  // Distance déjà parcourue
  const distanceCovered = currentProgress * totalDistance;

  // Trouver sur quel segment (arc) le camion se trouve
  let accumulatedDistance = 0;
  let currentSegmentIndex = 0;
  let distanceIntoSegment = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const segmentArc = findArcForSegment(path[i].nodeId, path[i + 1].nodeId, allArcs);
    const segmentDistance = segmentArc?.distance ? segmentArc.distance * 1000 : 0; // km → m

    if (accumulatedDistance + segmentDistance >= distanceCovered) {
      currentSegmentIndex = i;
      distanceIntoSegment = distanceCovered - accumulatedDistance;
      break;
    }

    accumulatedDistance += segmentDistance;
  }

  // Récupérer l'arc actuel
  const currentArc = findArcForSegment(
    path[currentSegmentIndex].nodeId,
    path[currentSegmentIndex + 1]?.nodeId,
    allArcs
  );

  if (!currentArc || !currentArc.distance) {
    // Pas d'arc trouvé, progression linéaire par défaut
    const defaultSpeedMs = baseSpeed / 3.6; // km/h → m/s
    const distanceThisUpdate = defaultSpeedMs * deltaTimeSeconds;
    const newProgress = Math.min(currentProgress + (distanceThisUpdate / totalDistance), 1.0);
    return newProgress;
  }

  // Calculer le facteur de ralentissement de l'arc actuel
  const slowdownFactor = calculateArcSlowdownFactor(currentArc);

  // Vitesse effective sur cet arc
  const effectiveSpeedKmh = baseSpeed / slowdownFactor;
  const effectiveSpeedMs = effectiveSpeedKmh / 3.6; // m/s

  // Distance parcourue pendant deltaTime
  const distanceThisUpdate = effectiveSpeedMs * deltaTimeSeconds;

  // Nouvelle progression
  const newDistanceCovered = Math.min(distanceCovered + distanceThisUpdate, totalDistance);
  const newProgress = newDistanceCovered / totalDistance;

  return Math.min(newProgress, 1.0);
}

/**
 * Calcule la distance totale d'un chemin en mètres
 */
function calculatePathDistance(path: PathNode[], allArcs: Arc[]): number {
  let totalDistance = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const arc = findArcForSegment(path[i].nodeId, path[i + 1].nodeId, allArcs);
    if (arc?.distance) {
      totalDistance += arc.distance * 1000; // km → m
    }
  }

  return totalDistance;
}

/**
 * Calcule la vitesse actuelle d'un camion sur son arc
 */
export function calculateCurrentSpeed(
  currentProgress: number,
  path: PathNode[],
  allArcs: Arc[],
  baseSpeed: number
): number {
  if (path.length < 2) {
    return baseSpeed;
  }

  const totalDistance = calculatePathDistance(path, allArcs);
  if (totalDistance === 0) {
    return baseSpeed;
  }

  const distanceCovered = currentProgress * totalDistance;

  // Trouver l'arc actuel
  let accumulatedDistance = 0;
  let currentSegmentIndex = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const segmentArc = findArcForSegment(path[i].nodeId, path[i + 1].nodeId, allArcs);
    const segmentDistance = segmentArc?.distance ? segmentArc.distance * 1000 : 0;

    if (accumulatedDistance + segmentDistance >= distanceCovered) {
      currentSegmentIndex = i;
      break;
    }

    accumulatedDistance += segmentDistance;
  }

  const currentArc = findArcForSegment(
    path[currentSegmentIndex].nodeId,
    path[currentSegmentIndex + 1]?.nodeId,
    allArcs
  );

  if (!currentArc) {
    return baseSpeed;
  }

  const slowdownFactor = calculateArcSlowdownFactor(currentArc);
  return baseSpeed / slowdownFactor;
}
