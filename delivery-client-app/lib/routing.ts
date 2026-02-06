/**
 * Routing service using OSRM (Open Source Routing Machine)
 * Provides real road routing instead of straight lines
 */

interface OSRMRoute {
  geometry: {
    coordinates: Array<[number, number]>; // [lng, lat] format from OSRM
  };
  distance: number; // meters
  duration: number; // seconds
}

interface OSRMResponse {
  routes: OSRMRoute[];
  code: string;
}

/**
 * Get a real road route between two coordinates using OSRM
 * @param start - Starting coordinates [latitude, longitude]
 * @param end - Ending coordinates [latitude, longitude]
 * @returns Array of coordinates representing the route path
 */
export async function getRealRoute(
  start: [number, number],
  end: [number, number]
): Promise<{
  coordinates: Array<[number, number]>; // [lat, lng] format for Leaflet
  distance: number; // in kilometers
  duration: number; // in minutes
} | null> {
  try {
    // OSRM expects [lng, lat] format
    const startLngLat = `${start[1]},${start[0]}`;
    const endLngLat = `${end[1]},${end[0]}`;

    // Use OSRM demo server (for production, consider hosting your own OSRM instance)
    const url = `https://router.project-osrm.org/route/v1/driving/${startLngLat};${endLngLat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error("OSRM routing failed:", response.statusText);
      return null;
    }

    const data: OSRMResponse = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.error("OSRM no routes found");
      return null;
    }

    const route = data.routes[0];

    // Convert from OSRM [lng, lat] to Leaflet [lat, lng]
    const coordinates: Array<[number, number]> = route.geometry.coordinates.map(
      (coord) => [coord[1], coord[0]]
    );

    return {
      coordinates,
      distance: route.distance / 1000, // Convert meters to kilometers
      duration: route.duration / 60, // Convert seconds to minutes
    };
  } catch (error) {
    console.error("Error fetching route from OSRM:", error);
    return null;
  }
}

/**
 * Get a route passing through multiple waypoints
 * @param waypoints - Array of coordinates [[lat1, lng1], [lat2, lng2], ...]
 */
export async function getRealRouteWithWaypoints(
  waypoints: Array<[number, number]>
): Promise<{
  coordinates: Array<[number, number]>;
  distance: number;
  duration: number;
} | null> {
  try {
    if (waypoints.length < 2) {
      console.error("At least 2 waypoints are required");
      return null;
    }

    // Convert to OSRM format [lng, lat]
    const waypointsStr = waypoints
      .map((wp) => `${wp[1]},${wp[0]}`)
      .join(";");

    const url = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error("OSRM routing failed:", response.statusText);
      return null;
    }

    const data: OSRMResponse = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.error("OSRM no routes found");
      return null;
    }

    const route = data.routes[0];

    // Convert from OSRM [lng, lat] to Leaflet [lat, lng]
    const coordinates: Array<[number, number]> = route.geometry.coordinates.map(
      (coord) => [coord[1], coord[0]]
    );

    return {
      coordinates,
      distance: route.distance / 1000,
      duration: route.duration / 60,
    };
  } catch (error) {
    console.error("Error fetching route from OSRM:", error);
    return null;
  }
}
