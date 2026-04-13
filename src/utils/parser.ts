import type { DataPoint } from '../types';

export function parseSpectrumFile(text: string): DataPoint[] {
  const lines = text.trim().split('\n');
  const data: DataPoint[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split('\t');
    if (parts.length < 2) continue;

    const angle = parseFloat(parts[0]);
    const intensity = parseFloat(parts[1]);

    if (isNaN(angle) || isNaN(intensity)) continue;

    data.push({ angle, intensity });
  }

  return data;
}

export function findPeakAngle(data: DataPoint[]): number {
  let maxIntensity = -Infinity;
  let peakAngle = 0;

  for (const point of data) {
    if (point.intensity > maxIntensity) {
      maxIntensity = point.intensity;
      peakAngle = point.angle;
    }
  }

  return peakAngle;
}

export function centerData(data: DataPoint[], peakAngle: number): DataPoint[] {
  return data.map((p) => ({
    angle: p.angle - peakAngle,
    intensity: p.intensity,
  }));
}
