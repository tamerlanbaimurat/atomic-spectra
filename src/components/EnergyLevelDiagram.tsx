import { useState } from 'react';
import Plot from 'react-plotly.js';
import { HYDROGEN_ENERGY_LEVELS, wavelengthToVisibleColor } from '../utils/knownLines';
import type { DetectedPeak } from '../types';
import type { Data, Layout, Shape, Annotations } from 'plotly.js';

interface EnergyLevelDiagramProps {
  peaks: DetectedPeak[];
  element: string;
}

function HeightControl({
  height,
  setHeight,
  min,
  max,
}: {
  height: number;
  setHeight: (h: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
      <span>Plot height:</span>
      <input
        type="range"
        min={min}
        max={max}
        step={25}
        value={height}
        onChange={(e) => setHeight(parseInt(e.target.value))}
        className="flex-1 max-w-xs accent-indigo-500"
      />
      <span className="text-slate-400 w-14 text-right">{height}px</span>
      <button
        onClick={() => setHeight(min)}
        className="ml-2 px-2 py-0.5 rounded border border-[#3a3a52] text-slate-500 hover:text-slate-300 hover:border-indigo-500/50 transition-colors"
        title="Reset height"
      >
        Reset
      </button>
    </div>
  );
}

export function EnergyLevelDiagram({ peaks, element }: EnergyLevelDiagramProps) {
  if (element === 'Hydrogen' || element === 'Deuterium') {
    return <HydrogenDiagram peaks={peaks} />;
  }
  return <HeliumDiagram peaks={peaks} />;
}

// Hydrogen Balmer series (n → 2). Flag `primary: true` means the line is
// always drawn boldly (Hα is the main defensible feature in the lab data).
const BALMER_TRANSITIONS: {
  from: number;
  to: number;
  wavelength: number;
  label: string;
  primary?: boolean;
}[] = [
  { from: 3, to: 2, wavelength: 656.3, label: 'Hα', primary: true },
  { from: 4, to: 2, wavelength: 486.1, label: 'Hβ' },
  { from: 5, to: 2, wavelength: 434.0, label: 'Hγ' },
  { from: 6, to: 2, wavelength: 410.2, label: 'Hδ' },
  { from: 7, to: 2, wavelength: 397.0, label: 'Hε' },
];

// Tight tolerance for calling a theoretical line "observed". A broad tolerance
// (e.g. 30 nm) produced false matches (random peaks labelled as 4→2, etc.).
const MATCH_TOL_NM = 4;

function HydrogenDiagram({ peaks }: { peaks: DetectedPeak[] }) {
  const [height, setHeight] = useState(500);
  const [showTheoretical, setShowTheoretical] = useState(true);

  // Crop out n=1 entirely: only n = 2..7 are relevant for the Balmer series.
  const levels = HYDROGEN_ENERGY_LEVELS.filter((l) => l.n >= 2 && l.n <= 7);

  const shapes: Partial<Shape>[] = [];
  const annotations: Partial<Annotations>[] = [];
  const traces: Data[] = [];

  // Energy-level lines + labels
  for (const level of levels) {
    shapes.push({
      type: 'line',
      x0: 0.18,
      x1: 0.82,
      y0: level.energy,
      y1: level.energy,
      line: { color: '#6366f1', width: 2 },
    });
    annotations.push({
      x: 0.14,
      y: level.energy,
      text: `n=${level.n}`,
      showarrow: false,
      font: { color: '#cbd5e1', size: 12 },
      xanchor: 'right',
    });
    annotations.push({
      x: 0.86,
      y: level.energy,
      text: `${level.energy.toFixed(2)} eV`,
      showarrow: false,
      font: { color: '#64748b', size: 10 },
      xanchor: 'left',
    });
  }

  // Ionization limit reference line at E = 0
  shapes.push({
    type: 'line',
    x0: 0.18,
    x1: 0.82,
    y0: 0,
    y1: 0,
    line: { color: '#475569', width: 1, dash: 'dot' },
  });
  annotations.push({
    x: 0.82,
    y: 0,
    text: 'n=∞ (ionization)',
    showarrow: false,
    font: { color: '#64748b', size: 9 },
    xanchor: 'right',
    yshift: 8,
  });

  // Conservative peak-to-transition matching: each peak is assigned at most
  // once, to its single closest theoretical line within MATCH_TOL_NM. This
  // prevents loose/incorrect matches from being shown as "observed".
  const observedIdx = new Set<number>();
  const matchedWavelength = new Map<number, number>();
  for (const peak of peaks) {
    if (!peak.wavelength) continue;
    let bestIdx = -1;
    let bestDist = MATCH_TOL_NM;
    BALMER_TRANSITIONS.forEach((t, idx) => {
      const d = Math.abs(peak.wavelength! - t.wavelength);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    if (bestIdx >= 0) {
      const prev = matchedWavelength.get(bestIdx);
      const prevDist =
        prev !== undefined
          ? Math.abs(prev - BALMER_TRANSITIONS[bestIdx].wavelength)
          : Infinity;
      if (bestDist < prevDist) {
        matchedWavelength.set(bestIdx, peak.wavelength);
        observedIdx.add(bestIdx);
      }
    }
  }

  // Draw transitions. Hα is always shown as the primary observed feature.
  // Other Balmer lines are drawn as faint dashed references; only upgraded to
  // "observed" styling if a peak lies within MATCH_TOL_NM.
  BALMER_TRANSITIONS.forEach((t, idx) => {
    const fromLevel = levels.find((l) => l.n === t.from);
    const toLevel = levels.find((l) => l.n === t.to);
    if (!fromLevel || !toLevel) return;

    const isObserved = !!t.primary || observedIdx.has(idx);
    if (!isObserved && !showTheoretical) return;

    const x = 0.30 + (t.from - 3) * 0.10;
    const color = isObserved ? wavelengthToVisibleColor(t.wavelength) : '#64748b';

    if (isObserved) {
      // Solid colored arrow pointing down to n=2
      annotations.push({
        x,
        y: toLevel.energy,
        ax: x,
        ay: fromLevel.energy,
        xref: 'x',
        yref: 'y',
        axref: 'x',
        ayref: 'y',
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1.3,
        arrowwidth: t.primary ? 3 : 2.2,
        arrowcolor: color,
        text: '',
        standoff: 0,
      });
    } else {
      // Dashed thin grey line (theoretical, not resolved)
      shapes.push({
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: x,
        x1: x,
        y0: fromLevel.energy,
        y1: toLevel.energy,
        line: { color: '#475569', width: 1, dash: 'dash' },
      });
    }

    const matched = matchedWavelength.get(idx);
    const labelText = isObserved && matched
      ? `${t.label}<br>${t.wavelength.toFixed(1)} nm<br><span style="font-size:9px">(obs ${matched.toFixed(1)} nm)</span>`
      : `${t.label}<br>${t.wavelength.toFixed(1)} nm`;

    annotations.push({
      x,
      y: (fromLevel.energy + toLevel.energy) / 2,
      text: labelText,
      showarrow: false,
      font: {
        color: isObserved ? color : '#64748b',
        size: isObserved ? 11 : 9,
      },
      xanchor: 'left',
      xshift: 8,
      align: 'left',
    });
  });

  // Mini legend (paper coords)
  annotations.push(
    {
      xref: 'paper',
      yref: 'paper',
      x: 0.02,
      y: 0.98,
      xanchor: 'left',
      yanchor: 'top',
      text: '━━  Observed (Hα, 656.3 nm)',
      showarrow: false,
      font: { color: '#ff4444', size: 10 },
      bgcolor: 'rgba(26,26,46,0.6)',
      borderpad: 3,
    },
    {
      xref: 'paper',
      yref: 'paper',
      x: 0.02,
      y: 0.92,
      xanchor: 'left',
      yanchor: 'top',
      text: '- - - Theoretical Balmer (not resolved)',
      showarrow: false,
      font: { color: '#94a3b8', size: 10 },
    }
  );

  const layout: Partial<Layout> = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: '#1a1a2e',
    autosize: true,
    height,
    font: { color: '#94a3b8', family: 'Inter, system-ui, sans-serif' },
    xaxis: {
      showticklabels: false,
      showgrid: false,
      zeroline: false,
      range: [0, 1],
    },
    yaxis: {
      title: { text: 'Energy (eV)' },
      gridcolor: '#2a2a42',
      range: [-3.8, 0.3],
      tickmode: 'array',
      tickvals: [-3.4, -1.51, -0.85, -0.54, -0.38, -0.28, 0],
      ticktext: ['-3.40', '-1.51', '-0.85', '-0.54', '-0.38', '-0.28', '0'],
    },
    shapes,
    annotations,
    margin: { l: 60, r: 80, t: 30, b: 30 },
    showlegend: false,
    hovermode: 'closest',
    dragmode: 'zoom',
  };

  return (
    <div>
      <div className="flex items-center gap-4 flex-wrap">
        <HeightControl height={height} setHeight={setHeight} min={400} max={1400} />
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={showTheoretical}
            onChange={(e) => setShowTheoretical(e.target.checked)}
            className="accent-indigo-500"
          />
          Show unresolved Balmer lines
        </label>
      </div>
      <Plot
        data={traces}
        layout={layout}
        config={{
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
          displaylogo: false,
        }}
        useResizeHandler
        className="w-full"
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
}

function HeliumDiagram({ peaks }: { peaks: DetectedPeak[] }) {
  const [height, setHeight] = useState(550);
  const singletLevels = [
    { label: '1S¹', energy: 0, x: 0.15 },
    { label: '2S¹', energy: 20.6, x: 0.15 },
    { label: '2P¹', energy: 21.2, x: 0.30 },
    { label: '3S¹', energy: 22.9, x: 0.15 },
    { label: '3P¹', energy: 23.1, x: 0.30 },
    { label: '3D¹', energy: 23.1, x: 0.45 },
    { label: '4D¹', energy: 23.7, x: 0.45 },
    { label: '5D¹', energy: 24.0, x: 0.45 },
  ];

  const tripletLevels = [
    { label: '2S³', energy: 19.8, x: 0.60 },
    { label: '2P³', energy: 20.9, x: 0.75 },
    { label: '3S³', energy: 22.7, x: 0.60 },
    { label: '3D³', energy: 23.1, x: 0.90 },
    { label: '4S³', energy: 23.6, x: 0.60 },
    { label: '4D³', energy: 23.7, x: 0.90 },
    { label: '5D³', energy: 24.0, x: 0.90 },
  ];

  const allLevels = [...singletLevels, ...tripletLevels];
  const shapes: Partial<Shape>[] = [];
  const annotations: Partial<Annotations>[] = [];
  const traces: Data[] = [];

  for (const level of allLevels) {
    shapes.push({
      type: 'line',
      x0: level.x - 0.06,
      x1: level.x + 0.06,
      y0: level.energy,
      y1: level.energy,
      line: {
        color: level.x < 0.5 ? '#6366f1' : '#f59e0b',
        width: 2,
      },
    });
    annotations.push({
      x: level.x,
      y: level.energy,
      text: level.label,
      showarrow: false,
      font: { color: '#94a3b8', size: 9 },
      yshift: 12,
    });
  }

  const heTransitions = [
    { from: '3S¹', to: '2P¹', wavelength: 728.1 },
    { from: '3D¹', to: '2P¹', wavelength: 667.8 },
    { from: '3P¹', to: '2S¹', wavelength: 501.5 },
    { from: '4D¹', to: '2P¹', wavelength: 492.2 },
    { from: '5D¹', to: '2P¹', wavelength: 438.8 },
    { from: '3D³', to: '2P³', wavelength: 587.6 },
    { from: '4S³', to: '2P³', wavelength: 471.3 },
    { from: '4D³', to: '2P³', wavelength: 447.1 },
    { from: '5D³', to: '2P³', wavelength: 402.6 },
  ];

  for (const t of heTransitions) {
    const fromLevel = allLevels.find((l) => l.label === t.from);
    const toLevel = allLevels.find((l) => l.label === t.to);
    if (!fromLevel || !toLevel) continue;

    const color = wavelengthToVisibleColor(t.wavelength);
    const matchedPeak = peaks.find(
      (p) => p.wavelength && Math.abs(p.wavelength - t.wavelength) < 30
    );

    traces.push({
      x: [(fromLevel.x + toLevel.x) / 2, (fromLevel.x + toLevel.x) / 2],
      y: [fromLevel.energy, toLevel.energy],
      type: 'scatter',
      mode: 'lines',
      line: {
        color,
        width: matchedPeak ? 3 : 1.5,
        dash: matchedPeak ? 'solid' : 'dash',
      },
      showlegend: false,
      hoverinfo: 'text',
      text: [
        `${t.from}→${t.to}: ${t.wavelength} nm${matchedPeak ? ` (observed)` : ''}`,
      ],
    });
  }

  annotations.push(
    {
      x: 0.3,
      y: 24.8,
      text: 'Singlet (Parahelium)',
      showarrow: false,
      font: { color: '#6366f1', size: 12 },
    },
    {
      x: 0.75,
      y: 24.8,
      text: 'Triplet (Orthohelium)',
      showarrow: false,
      font: { color: '#f59e0b', size: 12 },
    }
  );

  shapes.push({
    type: 'line',
    x0: 0.52,
    x1: 0.52,
    y0: 19,
    y1: 25,
    line: { color: '#3a3a52', width: 1, dash: 'dash' },
  });

  const layout: Partial<Layout> = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: '#1a1a2e',
    autosize: true,
    height,
    font: { color: '#94a3b8', family: 'Inter, system-ui, sans-serif' },
    xaxis: {
      showticklabels: false,
      showgrid: false,
      zeroline: false,
      range: [0, 1],
    },
    yaxis: {
      title: { text: 'Excitation Energy (eV)' },
      gridcolor: '#2a2a42',
      range: [19, 25],
    },
    shapes,
    annotations,
    margin: { l: 60, r: 20, t: 30, b: 30 },
    showlegend: false,
    hovermode: 'closest',
    dragmode: 'zoom',
  };

  return (
    <div>
      <HeightControl height={height} setHeight={setHeight} min={450} max={1600} />
      <Plot
        data={traces}
        layout={layout}
        config={{
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
          displaylogo: false,
        }}
        useResizeHandler
        className="w-full"
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
}
