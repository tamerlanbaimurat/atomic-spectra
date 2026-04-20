import type { DataPoint } from '../types';

// The spectrometer sweep spans from one extreme through the bright central line
// to the opposite extreme, so the physical diffraction angle is half the raw value.
const RAW_SWEEP_TO_DIFFRACTION_SCALE = 0.5;

export function parseSpectrumFile(text: string): DataPoint[] {
  const lines = text.trim().split('\n');
  const data: DataPoint[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split('\t');
    if (parts.length < 2) continue;

    const angle = parseFloat(parts[0]) * RAW_SWEEP_TO_DIFFRACTION_SCALE;
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
