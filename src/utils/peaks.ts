import type { DataPoint, DetectedPeak } from '../types';

export function detectPeaks(
  data: DataPoint[],
  threshold: number = 2.5,
  minDistance: number = 0.01
): DetectedPeak[] {
  const peaks: DetectedPeak[] = [];

  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1].intensity;
    const curr = data[i].intensity;
    const next = data[i + 1].intensity;

    if (curr > prev && curr > next && curr >= threshold) {
      const lastPeak = peaks[peaks.length - 1];
      if (lastPeak && Math.abs(data[i].angle - lastPeak.angle) < minDistance) {
        if (curr > lastPeak.intensity) {
          peaks[peaks.length - 1] = {
            angle: data[i].angle,
            intensity: curr,
          };
        }
      } else {
        peaks.push({
          angle: data[i].angle,
          intensity: curr,
        });
      }
    }
  }

  // Also check for plateau peaks (multiple points at the same max)
  let i = 0;
  while (i < data.length) {
    if (data[i].intensity >= threshold) {
      let j = i;
      while (j < data.length && data[j].intensity === data[i].intensity) {
        j++;
      }
      if (j - i >= 3) {
        const midIdx = Math.floor((i + j) / 2);
        const existingPeak = peaks.find(
          (p) => Math.abs(p.angle - data[midIdx].angle) < minDistance
        );
        if (!existingPeak) {
          const beforeOk = i === 0 || data[i - 1].intensity < data[i].intensity;
          const afterOk = j >= data.length || data[j].intensity < data[j - 1].intensity;
          if (beforeOk && afterOk) {
            peaks.push({
              angle: data[midIdx].angle,
              intensity: data[midIdx].intensity,
            });
          }
        }
      }
      i = j;
    } else {
      i++;
    }
  }

  peaks.sort((a, b) => a.angle - b.angle);
  return peaks;
}

export function findSymmetricPeaks(
  peaks: DetectedPeak[],
  tolerance: number = 0.03
): { left: DetectedPeak; right: DetectedPeak; avgAngle: number }[] {
  const pairs: { left: DetectedPeak; right: DetectedPeak; avgAngle: number }[] = [];
  const negativePeaks = peaks.filter((p) => p.angle < -0.05);
  const positivePeaks = peaks.filter((p) => p.angle > 0.05);

  for (const left of negativePeaks) {
    for (const right of positivePeaks) {
      const angleDiff = Math.abs(Math.abs(left.angle) - Math.abs(right.angle));
      const intensityRatio =
        Math.min(left.intensity, right.intensity) /
        Math.max(left.intensity, right.intensity);

      if (angleDiff < tolerance && intensityRatio > 0.3) {
        const avgAngle = (Math.abs(left.angle) + Math.abs(right.angle)) / 2;
        pairs.push({ left, right, avgAngle });
      }
    }
  }

  return pairs.sort((a, b) => a.avgAngle - b.avgAngle);
}
