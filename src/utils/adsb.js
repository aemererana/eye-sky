import { findClosestAircraft } from './geo.js';

const API_BASE = 'https://api.adsb.lol/v2';
export const SEARCH_RADIUS_NM = 10;

export async function fetchNearbyAircraft(lat, lon, radiusNm = SEARCH_RADIUS_NM) {
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

  return findClosestAircraft(aircraft, lat, lon);
}
