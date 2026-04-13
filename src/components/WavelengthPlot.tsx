import Plot from 'react-plotly.js';
import type { SpectralDataset, GratingConfig, KnownLine } from '../types';
import { angleToWavelength } from '../utils/wavelength';
import { wavelengthToVisibleColor } from '../utils/knownLines';
import type { Data, Layout, Shape } from 'plotly.js';

interface WavelengthPlotProps {
  datasets: SpectralDataset[];
  gratingConfig: GratingConfig;
  knownLines: KnownLine[];
  showKnownLines: boolean;
}

export function WavelengthPlot({
  datasets,
  gratingConfig,
  knownLines,
  showKnownLines,
}: WavelengthPlotProps) {
  const traces: Data[] = [];

  for (const ds of datasets) {
    const positiveData = ds.centeredData.filter((p) => p.angle > 0.05);
    const wavelengths = positiveData.map((p) =>
      angleToWavelength(p.angle, gratingConfig)
    );

    traces.push({
      x: wavelengths,
      y: positiveData.map((p) => p.intensity),
      type: 'scatter',
      mode: 'lines',
      name: `${ds.name} (+side)`,
      line: { color: ds.color, width: 1.5 },
      hovertemplate: 'λ = %{x:.1f} nm<br>Intensity: %{y:.1f}%<extra></extra>',
    });

    const negativeData = ds.centeredData.filter((p) => p.angle < -0.05);
    const negWavelengths = negativeData.map((p) =>
      angleToWavelength(p.angle, gratingConfig)
    );

    traces.push({
      x: negWavelengths,
      y: negativeData.map((p) => p.intensity),
      type: 'scatter',
      mode: 'lines',
      name: `${ds.name} (-side)`,
      line: { color: ds.color, width: 1, dash: 'dot' },
      hovertemplate: 'λ = %{x:.1f} nm<br>Intensity: %{y:.1f}%<extra></extra>',
    });
  }

  const shapes: Partial<Shape>[] = [];

  if (showKnownLines) {
    for (const line of knownLines) {
      shapes.push({
        type: 'line',
        x0: line.wavelength,
        x1: line.wavelength,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: { color: line.color, width: 1.5, dash: 'dot' },
        opacity: 0.6,
      });
    }
  }

  // Visible spectrum background
  const bgShapes: Partial<Shape>[] = [];
  for (let w = 380; w < 780; w += 10) {
    bgShapes.push({
      type: 'rect',
      x0: w,
      x1: w + 10,
      y0: 0,
      y1: 1,
      yref: 'paper',
      fillcolor: wavelengthToVisibleColor(w + 5),
      opacity: 0.05,
      line: { width: 0 },
      layer: 'below',
    });
  }

  const layout: Partial<Layout> = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: '#1a1a2e',
    font: { color: '#94a3b8', family: 'Inter, system-ui, sans-serif' },
    xaxis: {
      title: { text: 'Wavelength (nm)' },
      gridcolor: '#2a2a42',
      range: [350, 750],
      autorange: false,
    },
    yaxis: {
      title: { text: 'Light Intensity (% max)' },
      gridcolor: '#2a2a42',
      rangemode: 'tozero',
    },
    legend: {
      bgcolor: 'rgba(30, 30, 46, 0.8)',
      bordercolor: '#3a3a52',
      borderwidth: 1,
      font: { size: 11 },
    },
    margin: { l: 60, r: 20, t: 30, b: 60 },
    shapes: [...bgShapes, ...shapes],
    hovermode: 'closest',
    dragmode: 'zoom',
  };

  return (
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
      style={{ height: '400px' }}
    />
  );
}
