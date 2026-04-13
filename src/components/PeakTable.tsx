import type { DetectedPeak } from '../types';
import { wavelengthToVisibleColor } from '../utils/knownLines';
import { wavelengthToEnergy } from '../utils/wavelength';

interface PeakTableProps {
  peaks: DetectedPeak[];
}

export function PeakTable({ peaks }: PeakTableProps) {
  if (peaks.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8 text-sm">
        No peaks detected. Upload data and adjust the threshold.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#3a3a52]">
            <th className="text-left py-2 px-3 text-slate-400 font-medium">#</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Angle (rad)</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Intensity (%)</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">λ (nm)</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">E (eV)</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Color</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Match</th>
          </tr>
        </thead>
        <tbody>
          {peaks.map((peak, i) => {
            const visColor = peak.wavelength
              ? wavelengthToVisibleColor(peak.wavelength)
              : undefined;
            const energy = peak.wavelength
              ? wavelengthToEnergy(peak.wavelength)
              : undefined;

            return (
              <tr
                key={i}
                className="border-b border-[#2a2a3e] hover:bg-[#2a2a3e]/50 transition-colors"
              >
                <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                <td className="py-2 px-3 font-mono">{peak.angle.toFixed(4)}</td>
                <td className="py-2 px-3">{peak.intensity.toFixed(1)}</td>
                <td className="py-2 px-3 font-mono">
                  {peak.wavelength ? peak.wavelength.toFixed(1) : '—'}
                </td>
                <td className="py-2 px-3 font-mono">
                  {energy ? energy.toFixed(3) : '—'}
                </td>
                <td className="py-2 px-3">
                  {visColor && (
                    <div
                      className="w-6 h-4 rounded"
                      style={{ background: visColor }}
                    />
                  )}
                </td>
                <td className="py-2 px-3">
                  {peak.matchedLine ? (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: `${peak.matchedLine.color}22`,
                        color: peak.matchedLine.color,
                        border: `1px solid ${peak.matchedLine.color}44`,
                      }}
                    >
                      {peak.matchedLine.label}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
