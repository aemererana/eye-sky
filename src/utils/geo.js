const EARTH_RADIUS_NM = 3440.065;
const MIN_AIRBORNE_ALT_FT = 500;

export const HEADING_TOLERANCE_DEG = 45;

export function isAirborne(aircraft) {
  const baro = aircraft.alt_baro;
  if (baro === 'ground') return false;

  const alt = typeof baro === 'number' ? baro : aircraft.alt_geom;
  if (alt == null || alt === 'ground') return false;
  if (typeof alt !== 'number' || Number.isNaN(alt)) return false;

  return alt >= MIN_AIRBORNE_ALT_FT;
}

export function distanceNm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a));
}

export function bearingDeg(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function angleDifference(headingA, headingB) {
  const diff = Math.abs(headingA - headingB) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function getAircraftBearing(aircraft, userLat, userLon) {
  if (typeof aircraft.dir === 'number' && !Number.isNaN(aircraft.dir)) {
    return aircraft.dir;
  }

  if (aircraft.lat == null || aircraft.lon == null) return null;
  return bearingDeg(userLat, userLon, aircraft.lat, aircraft.lon);
}

export function isInCameraDirection(aircraft, userLat, userLon, cameraHeading, tolerance = HEADING_TOLERANCE_DEG) {
  if (cameraHeading == null) return true;

  const aircraftBearing = getAircraftBearing(aircraft, userLat, userLon);
  if (aircraftBearing == null) return false;

  return angleDifference(aircraftBearing, cameraHeading) <= tolerance;
}

export function selectAircraft(aircraft, userLat, userLon, cameraHeading, tolerance = HEADING_TOLERANCE_DEG) {
  let closest = null;
  let minDistance = Infinity;

  for (const ac of aircraft) {
    if (ac.lat == null || ac.lon == null) continue;
    if (!isAirborne(ac)) continue;
    if (!isInCameraDirection(ac, userLat, userLon, cameraHeading, tolerance)) continue;

    const dist = distanceNm(userLat, userLon, ac.lat, ac.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = ac;
    }
  }

  return closest;
}
