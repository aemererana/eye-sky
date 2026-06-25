export const MOTION_THRESHOLD = 15;
export const MIN_CHANGED_PIXELS = 50;

export function detectMotion(currentData, previousData, threshold = MOTION_THRESHOLD) {
  if (!previousData || currentData.data.length !== previousData.data.length) {
    return { motionDetected: false, bbox: null };
  }

  const { width, height, data: current } = currentData;
  const previous = previousData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let changedCount = 0;

  for (let i = 0; i < current.length; i += 4) {
    const dr = Math.abs(current[i] - previous[i]);
    const dg = Math.abs(current[i + 1] - previous[i + 1]);
    const db = Math.abs(current[i + 2] - previous[i + 2]);
    const channelAvg = (dr + dg + db) / 3;

    if (channelAvg > threshold) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.trunc(pixelIndex / width);

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      changedCount++;
    }
  }

  if (changedCount < MIN_CHANGED_PIXELS) {
    return { motionDetected: false, bbox: null };
  }

  return {
    motionDetected: true,
    bbox: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}

export function scaleBbox(bbox, analysisWidth, analysisHeight, displayWidth, displayHeight) {
  const scaleX = displayWidth / analysisWidth;
  const scaleY = displayHeight / analysisHeight;

  return {
    x: bbox.x * scaleX,
    y: bbox.y * scaleY,
    width: bbox.width * scaleX,
    height: bbox.height * scaleY,
  };
}
