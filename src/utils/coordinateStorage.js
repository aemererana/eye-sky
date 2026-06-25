import { validateCoordinates } from './coordinates.js';

const STORAGE_KEY = 'eye-sky-coordinates';

export function loadSavedCoordinates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const { lat, lon } = JSON.parse(raw);
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;
    if (validateCoordinates(lat, lon)) return null;

    return { lat, lon };
  } catch {
    return null;
  }
}

export function saveCoordinates(lat, lon) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lon }));
  } catch {
    // Storage may be unavailable in private mode.
  }
}
