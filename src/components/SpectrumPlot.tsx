import Plot from 'react-plotly.js';
import type { SpectralDataset, DetectedPeak, GratingConfig, KnownLine } from '../types';
import { wavelengthToAngle } from '../utils/wavelength';
import type { Data, Layout, Shape, Annotations } from 'plotly.js';

interface SpectrumPlotProps {
  datasets: SpectralDataset[];
  peaks: DetectedPeak[];
  showPeaks: boolean;
  showKnownLines: boolean;
  knownLines: KnownLine[];
  gratingConfig: GratingConfig;
  centered: boolean;
}

export function SpectrumPlot({
  datasets,
  peaks,
  showPeaks,
  showKnownLines,
  knownLines,
  gratingConfig,
  centered,
}: SpectrumPlotProps) {
  const traces: Data[] = [];

  for (const ds of datasets) {
    const data = centered ? ds.centeredData : ds.rawData;
    traces.push({
      x: data.map((p) => p.angle),
      y: data.map((p) => p.intensity),
      type: 'scatter',
      mode: 'lines',
      name: ds.name,
      line: { color: ds.color, width: 1.5 },
      hovertemplate: 'Angle: %{x:.4f} rad<br>Intensity: %{y:.1f}%<extra></extra>',
    });
  }

  if (showPeaks && peaks.length > 0) {
    traces.push({
      x: peaks.map((p) => p.angle),
      y: peaks.map((p) => p.intensity),
      type: 'scatter',
      mode: 'text+markers' as const,
      name: 'Detected Peaks',
      marker: {
        color: '#f59e0b',
        size: 8,
        symbol: 'diamond',
        line: { color: '#fbbf24', width: 1 },
      },
      text: peaks.map((p) =>
        p.wavelength ? `${p.wavelength.toFixed(1)} nm` : `${p.angle.toFixed(3)} rad`
      ),
      textposition: 'top center',
      textfont: { size: 9, color: '#fbbf24' },
      hovertemplate: peaks.map(
        (p) =>
          `Angle: ${p.angle.toFixed(4)} rad<br>Intensity: ${p.intensity.toFixed(1)}%` +
          (p.wavelength ? `<br>λ = ${p.wavelength.toFixed(1)} nm` : '') +
          (p.matchedLine ? `<br>Match: ${p.matchedLine.label}` : '') +
          '<extra></extra>'
      ),
    });
  }

  const shapes: Partial<Shape>[] = [];
  const annotations: Partial<Annotations>[] = [];

  if (showKnownLines && centered) {
    for (const line of knownLines) {
      const angle = wavelengthToAngle(line.wavelength, gratingConfig);
      if (isNaN(angle)) continue;

      for (const sign of [-1, 1]) {
        shapes.push({
          type: 'line',
          x0: sign * angle,
          x1: sign * angle,
          y0: 0,
          y1: 1,
          yref: 'paper',
          line: { color: line.color, width: 1, dash: 'dot' },
          opacity: 0.5,
        });
      }

      annotations.push({
        x: angle,
        y: 1,
        yref: 'paper',
        text: line.label,
        showarrow: false,
        font: { size: 8, color: line.color },
        textangle: -45 as unknown as string,
        yanchor: 'bottom',
      });
    }
  }

  const layout: Partial<Layout> = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: '#1a1a2e',
    font: { color: '#94a3b8', family: 'Inter, system-ui, sans-serif' },
    xaxis: {
      title: { text: centered ? 'Angle from center (radians)' : 'Angle (radians)' },
      gridcolor: '#2a2a42',
      zerolinecolor: '#4a4a6a',
      zerolinewidth: centered ? 2 : 1,
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
    shapes,
    annotations,
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
      style={{ height: '500px' }}
    />
  );
}
