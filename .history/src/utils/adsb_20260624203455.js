import { HEADING_TOLERANCE_DEG, selectAircraft } from './geo.js';

const API_BASE = '/api/adsb/v2';
export const SEARCH_RADIUS_NM = 15;
export { HEADING_TOLERANCE_DEG };

export async function fetchNearbyAircraft(
  lat,
  lon,
  cameraHeading = null,
  radiusNm = SEARCH_RADIUS_NM,
  headingTolerance = HEADING_TOLERANCE_DEG,
) {
  const url = `${API_BASE}/lat/${lat}/lon/${lon}/dist/${radiusNm}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ADS-B API error: ${response.status}`);
  }

  const data = await response.json();
  const aircraft = data.ac ?? [];

  if (aircraft.length === 0) {
    return null;
  }

  return selectAircraft(aircraft, lat, lon, cameraHeading, headingTolerance);
}
