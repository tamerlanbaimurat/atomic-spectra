import { useState } from 'react';
import Plot from 'react-plotly.js';
import { HYDROGEN_ENERGY_LEVELS, wavelengthToVisibleColor } from '../utils/knownLines';
import type { DetectedPeak } from '../types';
import { wavelengthToEnergy } from '../utils/wavelength';
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

function HydrogenDiagram({ peaks }: { peaks: DetectedPeak[] }) {
  const [height, setHeight] = useState(500);
  const levels = HYDROGEN_ENERGY_LEVELS;
  const shapes: Partial<Shape>[] = [];
  const annotations: Partial<Annotations>[] = [];
  const traces: Data[] = [];

  for (const level of levels) {
    shapes.push({
      type: 'line',
      x0: 0.2,
      x1: 0.8,
      y0: level.energy,
      y1: level.energy,
      line: { color: '#6366f1', width: 2 },
    });
    annotations.push({
      x: 0.12,
      y: level.energy,
      text: `n=${level.n}`,
      showarrow: false,
      font: { color: '#94a3b8', size: 11 },
      xanchor: 'right',
    });
    annotations.push({
      x: 0.88,
      y: level.energy,
      text: `${level.energy.toFixed(2)} eV`,
      showarrow: false,
      font: { color: '#64748b', size: 10 },
      xanchor: 'left',
    });
  }

  const balmerTransitions = [
    { from: 3, to: 2, wavelength: 656.3 },
    { from: 4, to: 2, wavelength: 486.1 },
    { from: 5, to: 2, wavelength: 434.0 },
    { from: 6, to: 2, wavelength: 410.2 },
  ];

  for (const t of balmerTransitions) {
    const fromLevel = levels.find((l) => l.n === t.from);
    const toLevel = levels.find((l) => l.n === t.to);
    if (!fromLevel || !toLevel) continue;

    const x = 0.3 + (t.from - 3) * 0.12;
    const color = wavelengthToVisibleColor(t.wavelength);

    const matchedPeak = peaks.find(
      (p) => p.wavelength && Math.abs(p.wavelength - t.wavelength) < 30
    );

    traces.push({
      x: [x, x],
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
        `${t.from}→${t.to}: ${t.wavelength} nm${matchedPeak ? ` (measured: ${matchedPeak.wavelength?.toFixed(1)} nm)` : ''}`,
      ],
    });

    annotations.push({
      x,
      y: (fromLevel.energy + toLevel.energy) / 2,
      text: `${t.wavelength} nm`,
      showarrow: false,
      font: { color, size: 9 },
      textangle: -90 as unknown as string,
      xanchor: 'right',
      xshift: -6,
    });
  }

  const measuredWavelengths = peaks
    .filter((p) => p.wavelength && p.wavelength > 350 && p.wavelength < 800)
    .map((p) => p.wavelength!);

  if (measuredWavelengths.length > 0) {
    for (const wl of measuredWavelengths) {
      const energy = wavelengthToEnergy(wl);
      const lowerE = -3.4; // n=2
      const upperE = lowerE + energy;

      const closestLevel = levels.reduce((best, l) =>
        Math.abs(l.energy - upperE) < Math.abs(best.energy - upperE) ? l : best
      );

      if (Math.abs(closestLevel.energy - upperE) < 0.5) continue;
    }
  }

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
      range: [-15, 1],
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
      <HeightControl height={height} setHeight={setHeight} min={400} max={1600} />
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
