import { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/store';
import { getNodePositions, getEdgeOffsets } from './GraphCanvas';
import { getAllDiagrams } from '../storage/diagramStorage';
import type { SavedDiagram } from '../types';

export default function ConfigToolbar() {
    const {
        pinnedEdgeIds,
        animationsEnabled,
        resetToDefaults,
        setShowAddServiceModal,
        unpinAllEdges,
        toggleAnimations,
        savedDiagrams,
        activeDiagramId,
        refreshDiagramList,
        saveDiagram,
        loadDiagram,
        deleteDiagram,
    } = useAppStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveName, setSaveName] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load diagram list on mount
    useEffect(() => {
        refreshDiagramList();
    }, [refreshDiagramList]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const activeDiagram = savedDiagrams.find((d) => d.id === activeDiagramId);

    // ─── Export ALL diagrams as bundle ───
    const handleExport = useCallback(async () => {
        const diagrams = await getAllDiagrams();
        const blob = new Blob([JSON.stringify(diagrams, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'microservice-graphs-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    // ─── Import diagrams (merge, skip duplicates by name) ───
    const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                const importedDiagrams: SavedDiagram[] = Array.isArray(parsed) ? parsed : [];
                const existingNames = new Set(savedDiagrams.map((d) => d.name));
                let importCount = 0;

                for (const diagram of importedDiagrams) {
                    if (diagram.name && diagram.services && diagram.connections && !existingNames.has(diagram.name)) {
                        // Ensure unique ID
                        const newDiagram: SavedDiagram = {
                            ...diagram,
                            id: `diagram-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        };
                        const { putDiagram } = await import('../storage/diagramStorage');
                        await putDiagram(newDiagram);
                        existingNames.add(diagram.name);
                        importCount++;
                    }
                }

                await refreshDiagramList();
                if (importCount > 0) {
                    alert(`Imported ${importCount} diagram(s). Skipped ${importedDiagrams.length - importCount} duplicate(s).`);
                } else {
                    alert('No new diagrams to import (all names already exist).');
                }
            } catch {
                console.error('Invalid export file');
                alert('Invalid export file format.');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [savedDiagrams, refreshDiagramList]);

    // ─── Save / Update current diagram ───
    const handleSave = useCallback(async () => {
        if (activeDiagram) {
            // Update existing
            const positions = getNodePositions();
            const offsets = getEdgeOffsets();
            await saveDiagram(activeDiagram.name, positions, offsets);
        } else {
            // Prompt for name
            setSaveName('');
            setSaveModalOpen(true);
        }
    }, [activeDiagram, saveDiagram]);

    const handleSaveConfirm = useCallback(async () => {
        const name = saveName.trim();
        if (!name) return;
        const positions = getNodePositions();
        const offsets = getEdgeOffsets();
        await saveDiagram(name, positions, offsets);
        setSaveModalOpen(false);
    }, [saveName, saveDiagram]);

    const handleLoad = useCallback(async (id: string) => {
        await loadDiagram(id);
        setDropdownOpen(false);
    }, [loadDiagram]);

    const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this diagram?')) {
            await deleteDiagram(id);
        }
    }, [deleteDiagram]);

    return (
        <>
            <div className="flex items-center gap-1 px-4 py-2 bg-surface-900 border-b border-surface-700/50">
                <div className="flex items-center gap-1 mr-auto">
                    <span className="text-sm font-semibold text-surface-300">◈ Microservice Graph</span>
                </div>

                {/* ─── Diagram Switcher Dropdown ─── */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 transition-colors min-w-[140px] justify-between"
                        title="Switch diagram"
                    >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="truncate max-w-[120px]">
                            {activeDiagram ? activeDiagram.name : 'Unsaved Diagram'}
                        </span>
                        <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-surface-800 border border-surface-600/50 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-fade-in">
                            <div className="px-3 py-2 border-b border-surface-700/50">
                                <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                                    Saved Diagrams ({savedDiagrams.length})
                                </span>
                            </div>
                            <div className="max-h-[240px] overflow-y-auto scrollbar-thin">
                                {savedDiagrams.length === 0 ? (
                                    <div className="px-3 py-4 text-xs text-surface-500 text-center">
                                        No saved diagrams yet.
                                        <br />Use <strong>Save</strong> to save the current layout.
                                    </div>
                                ) : (
                                    savedDiagrams
                                        .sort((a, b) => b.updatedAt - a.updatedAt)
                                        .map((d) => (
                                            <div
                                                key={d.id}
                                                onClick={() => handleLoad(d.id)}
                                                className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors group ${d.id === activeDiagramId
                                                    ? 'bg-cyan-400/10 text-cyan-300'
                                                    : 'text-surface-300 hover:bg-surface-700/50'
                                                    }`}
                                            >
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-xs font-medium truncate">{d.name}</span>
                                                    <span className="text-[10px] text-surface-500">
                                                        {d.services.length} services · {d.connections.length} edges
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDelete(e, d.id)}
                                                    className="p-1 rounded-md text-surface-500 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
                                                    title="Delete diagram"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))
                                )}
                            </div>
                            {/* New diagram option */}
                            <div className="border-t border-surface-700/50">
                                <div
                                    onClick={() => { resetToDefaults(); setDropdownOpen(false); }}
                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer text-surface-400 hover:bg-surface-700/50 hover:text-surface-200 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-xs font-medium">New Diagram (Reset)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/20 transition-colors"
                    title={activeDiagram ? `Save "${activeDiagram.name}"` : 'Save current diagram'}
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {activeDiagram ? 'Save' : 'Save As'}
                </button>

                <div className="w-px h-5 bg-surface-700/50 mx-1" />

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
                    title="Export all diagrams"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export All
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

            {/* ─── Save Name Modal ─── */}
            {saveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface-800 border border-surface-600/50 rounded-2xl shadow-2xl shadow-black/40 p-6 w-[360px] animate-fade-in">
                        <h3 className="text-sm font-semibold text-surface-200 mb-4">Save Diagram</h3>
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveConfirm(); }}
                            placeholder="Diagram name..."
                            className="w-full px-3 py-2 bg-surface-900 border border-surface-600/50 rounded-lg text-sm text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setSaveModalOpen(false)}
                                className="px-4 py-1.5 rounded-lg text-xs font-medium text-surface-400 hover:bg-surface-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveConfirm}
                                disabled={!saveName.trim()}
                                className="px-4 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
