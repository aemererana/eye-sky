export function getCameraSupportError() {
  if (!window.isSecureContext) {
    return (
      'Camera and location require HTTPS. On your phone, open the Wi‑Fi URL from the terminal ' +
      '(e.g. https://192.168.x.x:5173), not a Tailscale 100.x.x address. ' +
      'In Safari, tap Advanced → Proceed to trust the dev certificate.'
    );
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return 'This browser does not support camera access.';
  }

  return null;
}

export function getCameraErrorMessage(err) {
  const supportError = getCameraSupportError();
  if (supportError) return supportError;

  if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
    return (
      'Camera permission denied. On iPhone: open Settings → Chrome → Camera and turn it On, ' +
      'then return here, reload the page, and tap Start again.'
    );
  }

  if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
    return 'No camera was found on this device.';
  }

  if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
    return 'Camera is in use by another app. Close other camera apps and try again.';
  }

  if (err?.name === 'OverconstrainedError' || err?.name === 'ConstraintNotSatisfiedError') {
    return 'Could not open the rear camera. Try again or use Safari.';
  }

  if (err?.message) {
    return err.message;
  }

  return 'Unable to access the camera. Please allow camera permissions and try again.';
}

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function requestBackCamera() {
  const supportError = getCameraSupportError();
  if (supportError) {
    throw Object.assign(new Error(supportError), { name: 'SecurityError' });
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch (err) {
    // Some browsers reject { ideal: 'environment' }; retry with any camera.
    if (err?.name === 'OverconstrainedError' || err?.name === 'ConstraintNotSatisfiedError') {
      return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }
    throw err;
  }
}

export { stopStream };
