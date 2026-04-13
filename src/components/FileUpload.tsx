import { useCallback, useRef } from 'react';

interface FileUploadProps {
  onFilesLoaded: (files: { name: string; content: string }[]) => void;
}

const DATASET_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

export function FileUpload({ onFilesLoaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const results: { name: string; content: string }[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const content = await file.text();
        results.push({ name: file.name, content });
      }
      onFilesLoaded(results);
    },
    [onFilesLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[#3a3a52] hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:bg-[#2a2a3e]/50 group"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300">
              Drop spectrum files here or click to browse
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports tab-separated .txt files (angle vs intensity)
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.csv,.tsv,.dat"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {DATASET_COLORS.slice(0, 3).map((color, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span>Run #{i + 1}</span>
          </div>
        ))}
        <span className="text-xs text-slate-600">...</span>
      </div>
    </div>
  );
}

export { DATASET_COLORS };
