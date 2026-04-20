import { useState, useMemo, useCallback } from 'react';
import type { SpectralDataset, GratingConfig } from './types';
import { parseSpectrumFile, findPeakAngle, centerData } from './utils/parser';
import { detectPeaks } from './utils/peaks';
import { calculateWavelengths, matchPeaksToKnownLines } from './utils/wavelength';
import { ALL_KNOWN_LINES } from './utils/knownLines';
import { FileUpload, DATASET_COLORS } from './components/FileUpload';
import { SpectrumPlot } from './components/SpectrumPlot';
import { WavelengthPlot } from './components/WavelengthPlot';
import { PeakTable } from './components/PeakTable';
import { SymmetricPeakTable } from './components/SymmetricPeakTable';
import { EnergyLevelDiagram } from './components/EnergyLevelDiagram';
import { SpectrumBar } from './components/SpectrumBar';

type Tab = 'spectrum' | 'wavelength' | 'peaks' | 'symmetric' | 'energy';

export default function App() {
  const [datasets, setDatasets] = useState<SpectralDataset[]>([]);
  const [gratingConfig, setGratingConfig] = useState<GratingConfig>({
    d: 1667,
    order: 1,
  });
  const [threshold, setThreshold] = useState(2.5);
  const [showPeaks, setShowPeaks] = useState(true);
  const [showKnownLines, setShowKnownLines] = useState(true);
  const [selectedElement, setSelectedElement] = useState('Helium');
  const [activeTab, setActiveTab] = useState<Tab>('spectrum');
  const [activeDatasetIdx, setActiveDatasetIdx] = useState(0);
  const [centered, setCentered] = useState(true);

  const handleFilesLoaded = useCallback(
    (files: { name: string; content: string }[]) => {
      const newDatasets: SpectralDataset[] = files.map((file, i) => {
        const rawData = parseSpectrumFile(file.content);
        const peakAngle = findPeakAngle(rawData);
        const centeredData = centerData(rawData, peakAngle);
        const colorIdx = (datasets.length + i) % DATASET_COLORS.length;

        return {
          id: `${Date.now()}-${i}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          rawData,
          centeredData,
          peakAngle,
          color: DATASET_COLORS[colorIdx],
        };
      });

      setDatasets((prev) => [...prev, ...newDatasets]);
    },
    [datasets.length]
  );

  const removeDataset = useCallback((id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const knownLines = useMemo(
    () => ALL_KNOWN_LINES[selectedElement] || [],
    [selectedElement]
  );

  const activeDataset = datasets[activeDatasetIdx] || datasets[0];

  const peaks = useMemo(() => {
    if (!activeDataset) return [];
    const raw = detectPeaks(activeDataset.centeredData, threshold);
    const withWavelengths = calculateWavelengths(raw, gratingConfig);
    return matchPeaksToKnownLines(withWavelengths, knownLines);
  }, [activeDataset, threshold, gratingConfig, knownLines]);

  const nonZeroPeaks = useMemo(
    () => peaks.filter((p) => Math.abs(p.angle) > 0.05),
    [peaks]
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'spectrum', label: 'Angle Plot' },
    { id: 'wavelength', label: 'Wavelength Plot' },
    { id: 'peaks', label: 'Peak Analysis' },
    { id: 'symmetric', label: 'Symmetric Pairs' },
    { id: 'energy', label: 'Energy Levels' },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <header className="border-b border-[#2a2a3e] bg-[#1a1a2e]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Atomic Spectra Analyzer</h1>
              <p className="text-xs text-slate-500">Diffraction grating spectroscopy analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">d =</span>
              <input
                type="number"
                value={gratingConfig.d}
                onChange={(e) =>
                  setGratingConfig((c) => ({ ...c, d: parseFloat(e.target.value) || 1667 }))
                }
                className="w-20 bg-[#2a2a3e] border border-[#3a3a52] rounded px-2 py-1 text-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-slate-500">nm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Order:</span>
              <select
                value={gratingConfig.order}
                onChange={(e) =>
                  setGratingConfig((c) => ({ ...c, order: parseInt(e.target.value) }))
                }
                className="bg-[#2a2a3e] border border-[#3a3a52] rounded px-2 py-1 text-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value={1}>1st</option>
                <option value={2}>2nd</option>
                <option value={3}>3rd</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Upload + Dataset List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#1e1e2e] rounded-xl border border-[#2a2a3e] p-4">
              <h2 className="text-sm font-medium text-slate-300 mb-3">Upload Data</h2>
              <FileUpload onFilesLoaded={handleFilesLoaded} />
            </div>

            {datasets.length > 0 && (
              <div className="bg-[#1e1e2e] rounded-xl border border-[#2a2a3e] p-4 space-y-3">
                <h2 className="text-sm font-medium text-slate-300">Loaded Datasets</h2>
                <div className="space-y-2">
                  {datasets.map((ds, i) => (
                    <div
                      key={ds.id}
                      onClick={() => setActiveDatasetIdx(i)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                        i === activeDatasetIdx
                          ? 'bg-indigo-500/10 border border-indigo-500/30'
                          : 'hover:bg-[#2a2a3e]/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: ds.color }}
                        />
                        <div>
                          <p className="text-sm text-slate-300">{ds.name}</p>
                          <p className="text-xs text-slate-600">
                            {ds.rawData.length} points · peak at {ds.peakAngle.toFixed(3)} rad
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDataset(ds.id);
                        }}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Controls */}
            <div className="bg-[#1e1e2e] rounded-xl border border-[#2a2a3e] p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Element:</span>
                  <select
                    value={selectedElement}
                    onChange={(e) => setSelectedElement(e.target.value)}
                    className="bg-[#2a2a3e] border border-[#3a3a52] rounded px-2 py-1 text-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {Object.keys(ALL_KNOWN_LINES).map((el) => (
                      <option key={el} value={el}>
                        {el}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Peak threshold:</span>
                  <input
                    type="range"
                    min={1.5}
                    max={20}
                    step={0.5}
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-24 accent-indigo-500"
                  />
                  <span className="text-xs text-slate-400 w-8">{threshold}%</span>
                </div>

                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={centered}
                    onChange={(e) => setCentered(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  Center on peak
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPeaks}
                    onChange={(e) => setShowPeaks(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  Show peaks
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showKnownLines}
                    onChange={(e) => setShowKnownLines(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  Known lines
                </label>
              </div>
            </div>

            {/* Spectrum bar */}
            {nonZeroPeaks.length > 0 && (
              <div className="bg-[#1e1e2e] rounded-xl border border-[#2a2a3e] p-4">
                <SpectrumBar peaks={nonZeroPeaks} />
              </div>
            )}
          </div>
        </div>

        {/* Tabs + Content */}
        {datasets.length > 0 && (
          <div className="bg-[#1e1e2e] rounded-xl border border-[#2a2a3e] overflow-hidden">
            <div className="border-b border-[#2a2a3e] flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-[#2a2a3e]/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === 'spectrum' && (
                <SpectrumPlot
                  datasets={datasets}
                  peaks={nonZeroPeaks}
                  showPeaks={showPeaks}
                  showKnownLines={showKnownLines}
                  knownLines={knownLines}
                  gratingConfig={gratingConfig}
                  centered={centered}
                />
              )}

              {activeTab === 'wavelength' && (
                <WavelengthPlot
                  datasets={datasets}
                  gratingConfig={gratingConfig}
                  knownLines={knownLines}
                  showKnownLines={showKnownLines}
                />
              )}

              {activeTab === 'peaks' && <PeakTable peaks={nonZeroPeaks} />}

              {activeTab === 'symmetric' && (
                <SymmetricPeakTable
                  peaks={nonZeroPeaks}
                  gratingConfig={gratingConfig}
                />
              )}

              {activeTab === 'energy' && (
                <EnergyLevelDiagram
                  peaks={nonZeroPeaks}
                  element={selectedElement}
                />
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {datasets.length === 0 && (
          <div className="bg-[#1e1e2e] rounded-xl border border-[#2a2a3e] p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2a2a3e] flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-400 mb-2">No data loaded</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Upload your spectral data files to get started. The app accepts tab-separated
              text files with sweep angle (radians) and light intensity (% max) columns,
              and converts the imported angles to diffraction angle by dividing by 2.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              {[
                {
                  title: 'Angle & Wavelength Plots',
                  desc: 'Intensity vs angle (centered on zeroth order) and converted wavelength plots with visible spectrum overlay.',
                },
                {
                  title: 'Peak Detection & Matching',
                  desc: 'Automatic peak finding with wavelength calculation and matching to known H, He, Na, D spectral lines.',
                },
                {
                  title: 'Energy Level Diagrams',
                  desc: 'Interactive Bohr model energy level diagrams for hydrogen and helium with observed transitions highlighted.',
                },
              ].map((item, i) => (
                <div key={i} className="bg-[#2a2a3e]/30 rounded-lg p-4 border border-[#3a3a52]/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1e1e2e] rounded-xl border border-[#2a2a3e] p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Diffraction Equation</h3>
            <div className="bg-[#2a2a3e]/50 rounded-lg p-3 font-mono text-center text-indigo-300">
              d sin(θ) = nλ
            </div>
            <p className="text-xs text-slate-600 mt-2">
              where d = {gratingConfig.d} nm (grating spacing), n = {gratingConfig.order} (order),
              θ = diffraction angle, λ = wavelength. Calibrate d using the sodium doublet
              (λ = 589.3 nm).
            </p>
          </div>
          <div className="bg-[#1e1e2e] rounded-xl border border-[#2a2a3e] p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Angle Measurement</h3>
            <div className="bg-[#2a2a3e]/50 rounded-lg p-3 font-mono text-center text-indigo-300">
              θ = (θ_right - θ_left) / 2
            </div>
            <p className="text-xs text-slate-600 mt-2">
              The true angle is half the difference between the same line on both sides
              of the zeroth order, eliminating systematic offset errors. Since these scans
              sweep from the right extreme through the central maximum to the left extreme,
              uploaded angles are halved before analysis.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2a2a3e] mt-12 py-6 text-center text-xs text-slate-600">
        Atomic Spectra Lab Analysis Tool — Physics Lab 4
      </footer>
    </div>
  );
}
