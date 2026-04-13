import type { KnownLine } from '../types';

export const HYDROGEN_LINES: KnownLine[] = [
  { element: 'H', wavelength: 656.3, color: '#ff4444', label: 'Hα (n=3→2)', transition: '3→2' },
  { element: 'H', wavelength: 486.1, color: '#44bbff', label: 'Hβ (n=4→2)', transition: '4→2' },
  { element: 'H', wavelength: 434.0, color: '#8844ff', label: 'Hγ (n=5→2)', transition: '5→2' },
  { element: 'H', wavelength: 410.2, color: '#aa44ff', label: 'Hδ (n=6→2)', transition: '6→2' },
  { element: 'H', wavelength: 397.0, color: '#cc44ff', label: 'Hε (n=7→2)', transition: '7→2' },
];

export const HELIUM_LINES: KnownLine[] = [
  { element: 'He', wavelength: 706.5, color: '#cc3333', label: '706.5 nm (3S¹→2P¹)', transition: 'singlet' },
  { element: 'He', wavelength: 667.8, color: '#ff4444', label: '667.8 nm (3D¹→2P¹)', transition: 'singlet' },
  { element: 'He', wavelength: 587.6, color: '#ffcc00', label: '587.6 nm (3D³→2P³)', transition: 'triplet' },
  { element: 'He', wavelength: 501.5, color: '#44cc44', label: '501.5 nm (3P¹→2S¹)', transition: 'singlet' },
  { element: 'He', wavelength: 492.2, color: '#44aaaa', label: '492.2 nm (4D¹→2P¹)', transition: 'singlet' },
  { element: 'He', wavelength: 471.3, color: '#4488cc', label: '471.3 nm (4S³→2P³)', transition: 'triplet' },
  { element: 'He', wavelength: 447.1, color: '#4466ff', label: '447.1 nm (4D³→2P³)', transition: 'triplet' },
  { element: 'He', wavelength: 438.8, color: '#5544ff', label: '438.8 nm (5D¹→2P¹)', transition: 'singlet' },
  { element: 'He', wavelength: 402.6, color: '#7744ff', label: '402.6 nm (5D³→2P³)', transition: 'triplet' },
];

export const SODIUM_LINES: KnownLine[] = [
  { element: 'Na', wavelength: 589.0, color: '#ffaa00', label: 'Na D₁ (589.0 nm)', transition: 'D1' },
  { element: 'Na', wavelength: 589.6, color: '#ffbb22', label: 'Na D₂ (589.6 nm)', transition: 'D2' },
];

export const DEUTERIUM_LINES: KnownLine[] = [
  { element: 'D', wavelength: 656.1, color: '#ff6666', label: 'Dα (n=3→2)', transition: '3→2' },
  { element: 'D', wavelength: 485.9, color: '#66bbff', label: 'Dβ (n=4→2)', transition: '4→2' },
  { element: 'D', wavelength: 433.9, color: '#9966ff', label: 'Dγ (n=5→2)', transition: '5→2' },
  { element: 'D', wavelength: 410.1, color: '#bb66ff', label: 'Dδ (n=6→2)', transition: '6→2' },
];

export const ALL_KNOWN_LINES: Record<string, KnownLine[]> = {
  Hydrogen: HYDROGEN_LINES,
  Helium: HELIUM_LINES,
  Sodium: SODIUM_LINES,
  Deuterium: DEUTERIUM_LINES,
};

export function wavelengthToVisibleColor(nm: number): string {
  if (nm < 380) return '#7700ff';
  if (nm < 440) {
    const t = (nm - 380) / (440 - 380);
    return `rgb(${Math.round((1 - t) * 120)}, 0, ${Math.round(255)})`;
  }
  if (nm < 490) {
    const t = (nm - 440) / (490 - 440);
    return `rgb(0, ${Math.round(t * 255)}, 255)`;
  }
  if (nm < 510) {
    const t = (nm - 490) / (510 - 490);
    return `rgb(0, 255, ${Math.round((1 - t) * 255)})`;
  }
  if (nm < 580) {
    const t = (nm - 510) / (580 - 510);
    return `rgb(${Math.round(t * 255)}, 255, 0)`;
  }
  if (nm < 645) {
    const t = (nm - 580) / (645 - 580);
    return `rgb(255, ${Math.round((1 - t) * 255)}, 0)`;
  }
  if (nm <= 780) return 'rgb(255, 0, 0)';
  return '#990000';
}

export const HYDROGEN_ENERGY_LEVELS = [
  { n: 1, energy: -13.6 },
  { n: 2, energy: -3.4 },
  { n: 3, energy: -1.51 },
  { n: 4, energy: -0.85 },
  { n: 5, energy: -0.54 },
  { n: 6, energy: -0.38 },
  { n: 7, energy: -0.28 },
];
