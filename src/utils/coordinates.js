export function toSignedCoordinate(value, hemisphere, isLatitude) {
  const num = parseFloat(String(value).trim());
  if (Number.isNaN(num)) return NaN;

  const max = isLatitude ? 90 : 180;
  if (num < 0 || num > max) return NaN;

  const positive = hemisphere === (isLatitude ? 'N' : 'E');
  return positive ? num : -num;
}

export function fromSignedCoordinate(signed, isLatitude) {
  if (signed == null || Number.isNaN(signed)) {
    return {
      value: '',
      hemisphere: isLatitude ? 'N' : 'W',
    };
  }

  return {
    value: Math.abs(signed).toFixed(6),
    hemisphere: isLatitude
      ? signed >= 0
        ? 'N'
        : 'S'
      : signed >= 0
        ? 'E'
        : 'W',
  };
}

export function validateCoordinates(lat, lon) {
  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    return 'Enter a valid latitude between 0 and 90.';
  }

  if (Number.isNaN(lon) || lon < -180 || lon > 180) {
    return 'Enter a valid longitude between 0 and 180.';
  }

  return null;
}
