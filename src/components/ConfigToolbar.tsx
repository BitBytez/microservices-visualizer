import { useRef } from 'react';
import { useAppStore } from '../store/store';

export default function ConfigToolbar() {
    const {
        pinnedEdgeIds,
        animationsEnabled,
        resetToDefaults,
        exportConfig,
        importConfig,
        setShowAddServiceModal,
        unpinAllEdges,
        toggleAnimations,
    } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const config = exportConfig();
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'microservice-graph-config.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target?.result as string);
                if (config.services && config.connections) {
                    importConfig(config);
                }
            } catch {
                console.error('Invalid config file');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex items-center gap-1 px-4 py-2 bg-surface-900 border-b border-surface-700/50">
            <div className="flex items-center gap-1 mr-auto">
                <span className="text-sm font-semibold text-surface-300">◈ Microservice Graph</span>
            </div>

            {/* Animation toggle */}
            <button
                onClick={toggleAnimations}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${animationsEnabled
                        ? 'text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/20'
                        : 'text-surface-400 bg-surface-800/50 hover:bg-surface-700/50 border-surface-600/30'
                    }`}
                title={animationsEnabled ? 'Disable animations' : 'Enable animations'}
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {animationsEnabled ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                    )}
                </svg>
                {animationsEnabled ? 'Animations On' : 'Animations Off'}
            </button>

            <div className="w-px h-5 bg-surface-700/50 mx-1" />

            <button
                onClick={() => setShowAddServiceModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-light bg-accent/10 hover:bg-accent/20 border border-accent/20 transition-colors"
                title="Add service (or double-click graph)"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Service
            </button>

            <div className="w-px h-5 bg-surface-700/50 mx-1" />

            <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-300 hover:bg-surface-800 transition-colors"
                title="Export configuration"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-300 hover:bg-surface-800 transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                />
            </label>

            <div className="w-px h-5 bg-surface-700/50 mx-1" />

            {pinnedEdgeIds.length > 0 && (
                <button
                    onClick={unpinAllEdges}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/20 transition-colors"
                    title="Unpin all metrics from canvas"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Unpin All ({pinnedEdgeIds.length})
                </button>
            )}

            <div className="w-px h-5 bg-surface-700/50 mx-1" />

            <button
                onClick={resetToDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Reset to defaults"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
            </button>
        </div>
    );
}
