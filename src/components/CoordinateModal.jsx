import { useEffect, useState } from 'react';
import {
  fromSignedCoordinate,
  toSignedCoordinate,
  validateCoordinates,
} from '../utils/coordinates.js';
import { loadSavedCoordinates, saveCoordinates } from '../utils/coordinateStorage.js';
import { getGeolocationErrorMessage, requestCurrentPosition } from '../utils/geolocation.js';

function getInitialCoordinateState() {
  const saved = loadSavedCoordinates();
  if (!saved) {
    return {
      latValue: '',
      latHemisphere: 'N',
      lonValue: '',
      lonHemisphere: 'W',
      restored: false,
    };
  }

  const latParts = fromSignedCoordinate(saved.lat, true);
  const lonParts = fromSignedCoordinate(saved.lon, false);

  return {
    latValue: latParts.value,
    latHemisphere: latParts.hemisphere,
    lonValue: lonParts.value,
    lonHemisphere: lonParts.hemisphere,
    restored: true,
  };
}

function applyGpsPosition(setLatValue, setLatHem, setLonValue, setLonHem, lat, lon) {
  const latParts = fromSignedCoordinate(lat, true);
  const lonParts = fromSignedCoordinate(lon, false);
  setLatValue(latParts.value);
  setLatHem(latParts.hemisphere);
  setLonValue(lonParts.value);
  setLonHem(lonParts.hemisphere);
}

function HemisphereToggle({ value, options, onChange, disabled }) {
  return (
    <div className="hemisphere-toggle" role="group">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={value === option ? 'active' : ''}
          onClick={() => onChange(option)}
          disabled={disabled}
          aria-pressed={value === option}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function CoordinateModal({ onStart, cameraError }) {
  const initial = getInitialCoordinateState();
  const [latValue, setLatValue] = useState(initial.latValue);
  const [latHemisphere, setLatHemisphere] = useState(initial.latHemisphere);
  const [lonValue, setLonValue] = useState(initial.lonValue);
  const [lonHemisphere, setLonHemisphere] = useState(initial.lonHemisphere);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [locating, setLocating] = useState(true);
  const [locationHint, setLocationHint] = useState(
    initial.restored ? 'Restored your last location. Updating GPS…' : 'Detecting your location…',
  );
  const isSecure = typeof window !== 'undefined' && window.isSecureContext;

  useEffect(() => {
    if (!isSecure) {
      setLocating(false);
      if (initial.restored) {
        setLocationHint('Using your last saved location.');
      } else {
        setLocationHint('');
      }
      return;
    }

    let cancelled = false;

    requestCurrentPosition()
      .then(({ lat, lon, accuracy }) => {
        if (cancelled) return;

        applyGpsPosition(setLatValue, setLatHemisphere, setLonValue, setLonHemisphere, lat, lon);
        setLocationHint(
          accuracy != null
            ? `Location detected (±${Math.round(accuracy)} m). You can adjust if needed.`
            : 'Location detected. You can adjust if needed.',
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setLocationHint(
          initial.restored
            ? `Using your last saved location. (${getGeolocationErrorMessage(err)})`
            : getGeolocationErrorMessage(err),
        );
      })
      .finally(() => {
        if (!cancelled) setLocating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSecure]);

  async function retryLocation() {
    if (!isSecure) return;

    setLocating(true);
    setLocationHint('Detecting your location…');
    setError('');

    try {
      const { lat, lon, accuracy } = await requestCurrentPosition();
      applyGpsPosition(setLatValue, setLatHemisphere, setLonValue, setLonHemisphere, lat, lon);
      setLocationHint(
        accuracy != null
          ? `Location detected (±${Math.round(accuracy)} m). You can adjust if needed.`
          : 'Location detected. You can adjust if needed.',
      );
    } catch (err) {
      setLocationHint(getGeolocationErrorMessage(err));
    } finally {
      setLocating(false);
    }
  }

  const hasCoordinates = latValue.trim() !== '' && lonValue.trim() !== '';
  const canStart = hasCoordinates && !starting;

  async function handleSubmit(event) {
    event.preventDefault();

    const lat = toSignedCoordinate(latValue, latHemisphere, true);
    const lon = toSignedCoordinate(lonValue, lonHemisphere, false);
    const validationError = validateCoordinates(lat, lon);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setStarting(true);
    saveCoordinates(lat, lon);

    try {
      await onStart(lat, lon);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h1>Eye Sky</h1>
        <p className="modal-subtitle">
          Your GPS coordinates are detected automatically when possible.
        </p>

        {!isSecure && (
          <div className="modal-warning">
            <strong>Secure connection required.</strong> Camera, GPS, and location only work over
            HTTPS. On your phone, use the <strong>Wi‑Fi URL</strong> from the terminal (e.g.{' '}
            <code>https://192.168.x.x:5173</code>), not a Tailscale{' '}
            <code>100.x.x.x</code> address — iOS often blocks those certificates. In Safari: tap
            Advanced → Proceed when warned about the certificate.
          </div>
        )}

        {locationHint && (
          <p className={`modal-hint${locating ? ' modal-hint-loading' : ''}`}>{locationHint}</p>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Latitude
            <div className="coord-row">
              <input
                type="text"
                inputMode="decimal"
                placeholder="37.7749"
                value={latValue}
                onChange={(e) => setLatValue(e.target.value)}
                autoComplete="off"
              />
              <HemisphereToggle
                value={latHemisphere}
                options={['N', 'S']}
                onChange={setLatHemisphere}
                disabled={starting}
              />
            </div>
          </label>

          <label>
            Longitude
            <div className="coord-row">
              <input
                type="text"
                inputMode="decimal"
                placeholder="122.4194"
                value={lonValue}
                onChange={(e) => setLonValue(e.target.value)}
                autoComplete="off"
              />
              <HemisphereToggle
                value={lonHemisphere}
                options={['E', 'W']}
                onChange={setLonHemisphere}
                disabled={starting}
              />
            </div>
          </label>

          {(error || cameraError) && (
            <p className="modal-error">{error || cameraError}</p>
          )}

          <div className="modal-actions">
            {isSecure && (
              <button
                type="button"
                className="modal-secondary"
                onClick={retryLocation}
                disabled={locating || starting}
              >
                {locating ? 'Locating…' : 'Retry GPS'}
              </button>
            )}

            <button type="submit" className="modal-primary" disabled={!canStart}>
              {starting ? 'Requesting camera…' : 'Start'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
