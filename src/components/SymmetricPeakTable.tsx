import type { DetectedPeak, GratingConfig } from '../types';
import { findSymmetricPeaks } from '../utils/peaks';
import { angleToWavelength, wavelengthToEnergy } from '../utils/wavelength';
import { wavelengthToVisibleColor } from '../utils/knownLines';

interface SymmetricPeakTableProps {
  peaks: DetectedPeak[];
  gratingConfig: GratingConfig;
}

export function SymmetricPeakTable({ peaks, gratingConfig }: SymmetricPeakTableProps) {
  const pairs = findSymmetricPeaks(peaks);

  if (pairs.length === 0) {
    return (
      <div className="text-center text-slate-500 py-6 text-sm">
        No symmetric peak pairs found. Make sure data is centered on the zeroth order.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Spectral lines appear symmetrically on both sides of the zeroth order.
        The true diffraction angle is the average of the two sides, which eliminates systematic offset errors.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#3a3a52]">
              <th className="text-left py-2 px-3 text-slate-400 font-medium">#</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Left (rad)</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Right (rad)</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Avg |θ| (rad)</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">λ (nm)</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">E (eV)</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Color</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, i) => {
              const wavelength = angleToWavelength(pair.avgAngle, gratingConfig);
              const energy = wavelengthToEnergy(wavelength);
              const color = wavelengthToVisibleColor(wavelength);

              return (
                <tr
                  key={i}
                  className="border-b border-[#2a2a3e] hover:bg-[#2a2a3e]/50 transition-colors"
                >
                  <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                  <td className="py-2 px-3 font-mono">{pair.left.angle.toFixed(4)}</td>
                  <td className="py-2 px-3 font-mono">{pair.right.angle.toFixed(4)}</td>
                  <td className="py-2 px-3 font-mono font-semibold">{pair.avgAngle.toFixed(4)}</td>
                  <td className="py-2 px-3 font-mono">{wavelength.toFixed(1)}</td>
                  <td className="py-2 px-3 font-mono">{energy.toFixed(3)}</td>
                  <td className="py-2 px-3">
                    <div className="w-6 h-4 rounded" style={{ background: color }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
