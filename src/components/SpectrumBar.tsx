import type { DetectedPeak } from '../types';
import { wavelengthToVisibleColor } from '../utils/knownLines';

interface SpectrumBarProps {
  peaks: DetectedPeak[];
}

export function SpectrumBar({ peaks }: SpectrumBarProps) {
  const visiblePeaks = peaks.filter(
    (p) => p.wavelength && p.wavelength >= 380 && p.wavelength <= 780
  );

  if (visiblePeaks.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Visible Spectrum
      </h4>
      <div className="relative h-12 rounded-lg overflow-hidden bg-black">
        {/* Background gradient showing the full visible spectrum */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background:
              'linear-gradient(to right, #7700ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff7700, #ff0000)',
          }}
        />

        {/* Peak markers */}
        {visiblePeaks.map((peak, i) => {
          const pos = ((peak.wavelength! - 380) / 400) * 100;
          const color = wavelengthToVisibleColor(peak.wavelength!);
          const width = Math.max(2, Math.min(8, peak.intensity / 10));

          return (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{
                left: `${pos}%`,
                width: `${width}px`,
                transform: 'translateX(-50%)',
                background: color,
                opacity: Math.min(1, peak.intensity / 20 + 0.3),
                boxShadow: `0 0 8px ${color}`,
              }}
              title={`${peak.wavelength?.toFixed(1)} nm — ${peak.intensity.toFixed(1)}%${peak.matchedLine ? ` (${peak.matchedLine.label})` : ''}`}
            />
          );
        })}

        {/* Wavelength labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[8px] text-slate-500">
          <span>380</span>
          <span>480</span>
          <span>580</span>
          <span>680</span>
          <span>780 nm</span>
        </div>
      </div>
    </div>
  );
}
