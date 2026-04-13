export interface DataPoint {
  angle: number;
  intensity: number;
}

export interface SpectralDataset {
  id: string;
  name: string;
  rawData: DataPoint[];
  centeredData: DataPoint[];
  peakAngle: number;
  color: string;
}

export interface DetectedPeak {
  angle: number;
  intensity: number;
  wavelength?: number;
  order?: number;
  matchedLine?: KnownLine;
}

export interface KnownLine {
  element: string;
  wavelength: number;
  color: string;
  label: string;
  transition?: string;
}

export interface GratingConfig {
  d: number; // grating spacing in nm
  order: number; // diffraction order
}
