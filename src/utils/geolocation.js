export function getGeolocationSupportError() {
  if (!window.isSecureContext) {
    return (
      'Location requires HTTPS. Use the Wi‑Fi URL from your terminal (192.168.x.x), not a Tailscale 100.x address.'
    );
  }

  if (!navigator.geolocation) {
    return 'This browser does not support geolocation.';
  }

  return null;
}

export function getGeolocationErrorMessage(err) {
  const supportError = getGeolocationSupportError();
  if (supportError) return supportError;

  if (err?.code === 1 || err?.name === 'NotAllowedError') {
    return 'Location permission denied. Allow location access or enter coordinates manually.';
  }

  if (err?.code === 2) {
    return 'Location unavailable. Enter coordinates manually.';
  }

  if (err?.code === 3) {
    return 'Location request timed out. Enter coordinates manually or tap Retry.';
  }

  return 'Could not detect your location. Enter coordinates manually.';
}

export function requestCurrentPosition(options = {}) {
  const supportError = getGeolocationSupportError();
  if (supportError) {
    return Promise.reject(new Error(supportError));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 60_000,
        ...options,
      },
    );
  });
}
