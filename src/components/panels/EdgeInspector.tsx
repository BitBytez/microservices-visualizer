import { useState } from 'react';
import { useAppStore } from '../../store/store';

export default function EdgeInspector() {
    const {
        connections,
        services,
        selectedEdgeId,
        addDashboard,
        updateDashboard,
        removeDashboard,
        removeConnection,
        setSelectedEdge,
    } = useAppStore();

    const connection = connections.find((c) => c.id === selectedEdgeId);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editUrl, setEditUrl] = useState('');

    if (!connection) return null;

    const sourceService = services.find((s) => s.id === connection.source);
    const targetService = services.find((s) => s.id === connection.target);

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAddDashboard = () => {
        if (!newTitle.trim() || !newUrl.trim()) return;
        addDashboard(connection.id, {
            id: `dash-${Date.now()}`,
            title: newTitle.trim(),
            iframeUrl: newUrl.trim(),
        });
        setNewTitle('');
        setNewUrl('');
    };

    const startEditing = (dashId: string, title: string, url: string) => {
        setEditingId(dashId);
        setEditTitle(title);
        setEditUrl(url);
    };

    const saveEdit = () => {
        if (!editingId) return;
        updateDashboard(connection.id, editingId, {
            title: editTitle.trim(),
            iframeUrl: editUrl.trim(),
        });
        setEditingId(null);
    };

    return (
        <div className="p-4 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sourceService?.color || '#64748b' }}
                    />
                    <span className="text-sm font-semibold text-surface-200 truncate">
                        {sourceService?.name || connection.source}
                    </span>
                    <svg className="w-4 h-4 text-surface-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: targetService?.color || '#64748b' }}
                    />
                    <span className="text-sm font-semibold text-surface-200 truncate">
                        {targetService?.name || connection.target}
                    </span>
                </div>
            </div>

            {connection.label && (
                <div className="text-xs text-surface-400 bg-surface-800/50 rounded-lg px-3 py-1.5 inline-block">
                    {connection.label}
                </div>
            )}

            {/* Dashboard count */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-surface-400 font-medium">Dashboards</span>
                <span className="text-xs bg-accent/20 text-accent-light px-2 py-0.5 rounded-full font-medium">
                    {connection.dashboards.length}
                </span>
            </div>

            {/* Dashboard cards — collapsed by default */}
            <div className="space-y-2">
                {connection.dashboards.map((dash) => {
                    const isExpanded = expandedIds.has(dash.id);
                    const isEditing = editingId === dash.id;

                    return (
                        <div
                            key={dash.id}
                            className={`rounded-xl border transition-all duration-200 ${isExpanded
                                    ? 'bg-surface-800/80 border-accent/30'
                                    : 'bg-surface-800/40 border-surface-700/50 hover:border-surface-600/50'
                                }`}
                        >
                            {/* Title bar (always visible) */}
                            <div
                                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer group"
                                onClick={() => toggleExpand(dash.id)}
                            >
                                <svg
                                    className={`w-3.5 h-3.5 text-surface-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''
                                        }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>

                                {isEditing ? (
                                    <input
                                        autoFocus
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEdit();
                                            if (e.key === 'Escape') setEditingId(null);
                                        }}
                                        className="flex-1 bg-surface-700 border border-accent/50 rounded px-2 py-0.5 text-sm text-surface-200 focus:outline-none"
                                    />
                                ) : (
                                    <span className="flex-1 text-sm text-surface-200 font-medium truncate group-hover:text-surface-100">
                                        {dash.title}
                                    </span>
                                )}

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(dash.id, dash.title, dash.iframeUrl);
                                        }}
                                        className="p-1 rounded-md text-surface-400 hover:text-accent-light hover:bg-accent/10 transition-colors"
                                        title="Edit"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeDashboard(connection.id, dash.id);
                                        }}
                                        className="p-1 rounded-md text-surface-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                        title="Remove"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Expanded: iframe + edit URL */}
                            {isExpanded && (
                                <div className="px-3 pb-3 space-y-2 animate-fade-in">
                                    {isEditing && (
                                        <div className="flex gap-2">
                                            <input
                                                value={editUrl}
                                                onChange={(e) => setEditUrl(e.target.value)}
                                                placeholder="iframe URL"
                                                className="flex-1 bg-surface-700 border border-accent/50 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none"
                                            />
                                            <button
                                                onClick={saveEdit}
                                                className="px-2 py-1 bg-accent/20 text-accent-light rounded text-xs font-medium hover:bg-accent/30 transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    )}

                                    {/* Lazy-loaded iframe */}
                                    <div className="rounded-lg overflow-hidden bg-surface-950 border border-surface-700/50">
                                        <iframe
                                            src={dash.iframeUrl}
                                            title={dash.title}
                                            className="w-full h-[200px] border-0"
                                            loading="lazy"
                                            sandbox="allow-scripts allow-same-origin allow-popups"
                                        />
                                    </div>

                                    <div className="text-[10px] text-surface-500 truncate">
                                        {dash.iframeUrl}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {connection.dashboards.length === 0 && (
                    <div className="text-center py-4 text-surface-500 text-sm">
                        No dashboards attached
                    </div>
                )}
            </div>

            {/* Add dashboard form */}
            <div className="border-t border-surface-700/50 pt-4">
                <label className="text-xs text-surface-400 font-medium block mb-2">Add Dashboard</label>
                <div className="space-y-2">
                    <input
                        placeholder="Dashboard title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent/50"
                    />
                    <input
                        placeholder="Grafana iframe URL"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent/50"
                    />
                    <button
                        onClick={handleAddDashboard}
                        disabled={!newTitle.trim() || !newUrl.trim()}
                        className="w-full px-4 py-2 bg-accent/20 text-accent-light rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Dashboard
                    </button>
                </div>
            </div>

            {/* Remove connection */}
            <div className="pt-3 border-t border-surface-700/50">
                <button
                    onClick={() => {
                        removeConnection(connection.id);
                        setSelectedEdge(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Connection
                </button>
            </div>
        </div>
    );
}
