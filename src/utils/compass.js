export async function requestCompassPermission() {
  try {
    if (typeof DeviceOrientationEvent === 'undefined') {
      return false;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const response = await DeviceOrientationEvent.requestPermission();
      return response === 'granted';
    }

    return true;
  } catch {
    // iOS only allows this during a user gesture; never block camera startup.
    return false;
  }
}

export function getCameraHeading(event) {
  let heading = null;

  if (typeof event.webkitCompassHeading === 'number' && !Number.isNaN(event.webkitCompassHeading)) {
    heading = event.webkitCompassHeading;
  } else if (event.absolute && typeof event.alpha === 'number' && !Number.isNaN(event.alpha)) {
    heading = (360 - event.alpha + 360) % 360;
  }

  if (heading == null) return null;

  const orientationAngle =
    typeof screen.orientation?.angle === 'number'
      ? screen.orientation.angle
      : typeof window.orientation === 'number'
        ? Math.abs(window.orientation)
        : 0;
  return (heading + orientationAngle + 360) % 360;
}

export function startHeadingTracking(onHeading) {
  function handleOrientation(event) {
    const heading = getCameraHeading(event);
    if (heading != null) {
      onHeading(heading);
    }
  }

  window.addEventListener('deviceorientationabsolute', handleOrientation, true);
  window.addEventListener('deviceorientation', handleOrientation, true);

  return () => {
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    window.removeEventListener('deviceorientation', handleOrientation, true);
  };
}
