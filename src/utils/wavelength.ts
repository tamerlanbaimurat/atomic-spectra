import type { DetectedPeak, GratingConfig, KnownLine } from '../types';

export function angleToWavelength(
  angleRad: number,
  config: GratingConfig
): number {
  return (config.d * Math.sin(Math.abs(angleRad))) / config.order;
}

export function wavelengthToAngle(
  wavelengthNm: number,
  config: GratingConfig
): number {
  const sinTheta = (config.order * wavelengthNm) / config.d;
  if (Math.abs(sinTheta) > 1) return NaN;
  return Math.asin(sinTheta);
}

export function calculateWavelengths(
  peaks: DetectedPeak[],
  config: GratingConfig
): DetectedPeak[] {
  return peaks.map((peak) => ({
    ...peak,
    wavelength: angleToWavelength(peak.angle, config),
    order: config.order,
  }));
}

export function matchPeaksToKnownLines(
  peaks: DetectedPeak[],
  knownLines: KnownLine[],
  toleranceNm: number = 30
): DetectedPeak[] {
  return peaks.map((peak) => {
    if (!peak.wavelength) return peak;
    let bestMatch: KnownLine | undefined;
    let bestDist = Infinity;

    for (const line of knownLines) {
      const dist = Math.abs(peak.wavelength - line.wavelength);
      if (dist < bestDist && dist < toleranceNm) {
        bestDist = dist;
        bestMatch = line;
      }
    }

    return { ...peak, matchedLine: bestMatch };
  });
}

export function wavelengthToEnergy(wavelengthNm: number): number {
  const hc = 1240; // eV·nm
  return hc / wavelengthNm;
}

export function calculateRydbergConstant(
  wavelengthNm: number,
  nLower: number,
  nUpper: number
): number {
  const wavelengthM = wavelengthNm * 1e-9;
  return 1 / (wavelengthM * (1 / (nLower * nLower) - 1 / (nUpper * nUpper)));
}
