const EARTH_RADIUS_NM = 3440.065;

export function distanceNm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a));
}

export function findClosestAircraft(aircraft, userLat, userLon) {
  let closest = null;
  let minDistance = Infinity;

  for (const ac of aircraft) {
    if (ac.lat == null || ac.lon == null) continue;
    const dist = distanceNm(userLat, userLon, ac.lat, ac.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = ac;
    }
  }

  return closest;
}
