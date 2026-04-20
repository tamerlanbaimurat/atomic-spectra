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
  const [compressGround, setCompressGround] = useState(true);
  const levels = HYDROGEN_ENERGY_LEVELS;

  // Piecewise-linear display mapping: compress energies below the break point
  // so n=1 at -13.6 eV doesn't push all the excited states into a thin band.
  // Real energies are preserved in labels and axis tick text.
  const BREAK = -4;
  const COMPRESS = 0.2;
  const toDisplay = (e: number) =>
    !compressGround || e >= BREAK ? e : BREAK + (e - BREAK) * COMPRESS;

  const yMin = compressGround ? toDisplay(-13.6) - 0.6 : -15;
  const yMax = 1;

  const shapes: Partial<Shape>[] = [];
  const annotations: Partial<Annotations>[] = [];
  const traces: Data[] = [];

  for (const level of levels) {
    const yd = toDisplay(level.energy);
    shapes.push({
      type: 'line',
      x0: 0.2,
      x1: 0.8,
      y0: yd,
      y1: yd,
      line: { color: '#6366f1', width: 2 },
    });
    annotations.push({
      x: 0.12,
      y: yd,
      text: `n=${level.n}`,
      showarrow: false,
      font: { color: '#94a3b8', size: 11 },
      xanchor: 'right',
    });
    annotations.push({
      x: 0.88,
      y: yd,
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

    const yFrom = toDisplay(fromLevel.energy);
    const yTo = toDisplay(toLevel.energy);

    traces.push({
      x: [x, x],
      y: [yFrom, yTo],
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
      y: (yFrom + yTo) / 2,
      text: `${t.wavelength} nm`,
      showarrow: false,
      font: { color, size: 9 },
      textangle: -90 as unknown as string,
      xanchor: 'right',
      xshift: -6,
    });
  }

  // Axis break indicator (zigzag) when compression is active
  if (compressGround) {
    const breakY = BREAK - 0.25;
    const zig = 0.015;
    shapes.push(
      {
        type: 'line',
        xref: 'paper',
        x0: 0,
        x1: 1,
        y0: breakY,
        y1: breakY,
        line: { color: '#1a1a2e', width: 8 },
      },
      {
        type: 'line',
        xref: 'paper',
        x0: 0,
        x1: 0.02,
        y0: breakY - zig,
        y1: breakY + zig,
        line: { color: '#94a3b8', width: 1 },
      },
      {
        type: 'line',
        xref: 'paper',
        x0: 0.02,
        x1: 0.04,
        y0: breakY + zig,
        y1: breakY - zig,
        line: { color: '#94a3b8', width: 1 },
      }
    );
    annotations.push({
      xref: 'paper',
      x: 0.05,
      y: breakY,
      text: 'axis break',
      showarrow: false,
      font: { color: '#64748b', size: 9 },
      xanchor: 'left',
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

  // Custom tick values so the y-axis still shows real eV numbers even under
  // the compressed display mapping.
  const tickRealValues = compressGround
    ? [-13.6, -10, -6, -4, -3.4, -1.5, -0.85, 0]
    : [-15, -12, -9, -6, -3, 0];
  const tickvals = tickRealValues.map(toDisplay);
  const ticktext = tickRealValues.map((v) => v.toFixed(v > -1 ? 1 : 1));

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
      range: [yMin, yMax],
      tickmode: 'array',
      tickvals,
      ticktext,
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
        <HeightControl height={height} setHeight={setHeight} min={400} max={1600} />
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={compressGround}
            onChange={(e) => setCompressGround(e.target.checked)}
            className="accent-indigo-500"
          />
          Compress n=1 gap
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
