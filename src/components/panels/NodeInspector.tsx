import { useState } from 'react';
import { useAppStore } from '../../store/store';
import type { ServiceType } from '../../types';

const typeOptions: { value: ServiceType; label: string; icon: string }[] = [
    { value: 'microservice', label: 'Service', icon: '⬡' },
    { value: 'database', label: 'Database', icon: '⛁' },
    { value: 'cache', label: 'Cache', icon: '◆' },
    { value: 'queue', label: 'Queue', icon: '↹' },
    { value: 'cdn', label: 'CDN', icon: '◎' },
    { value: 'gateway', label: 'Gateway', icon: '⊞' },
];

export default function NodeInspector() {
    const { services, selectedNodeId, updateService, removeService, setSelectedNode } = useAppStore();
    const service = services.find((s) => s.id === selectedNodeId);

    const [editingName, setEditingName] = useState(false);
    const [editingDesc, setEditingDesc] = useState(false);
    const [newLinkLabel, setNewLinkLabel] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');

    if (!service) return null;

    const handleNameSave = (name: string) => {
        updateService(service.id, { name: name.trim() || service.name });
        setEditingName(false);
    };

    const handleDescSave = (description: string) => {
        updateService(service.id, { description });
        setEditingDesc(false);
    };

    const handleAddLink = () => {
        if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
        const links = [...(service.links || []), { label: newLinkLabel.trim(), url: newLinkUrl.trim() }];
        updateService(service.id, { links });
        setNewLinkLabel('');
        setNewLinkUrl('');
    };

    const handleRemoveLink = (index: number) => {
        const links = (service.links || []).filter((_, i) => i !== index);
        updateService(service.id, { links });
    };

    return (
        <div className="p-4 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-lg font-bold flex-shrink-0"
                    style={{
                        backgroundColor: service.color + '20',
                        color: service.color,
                    }}
                >
                    {typeOptions.find((t) => t.value === service.type)?.icon || '⬡'}
                </div>
                <div className="flex-1 min-w-0">
                    {editingName ? (
                        <input
                            autoFocus
                            defaultValue={service.name}
                            onBlur={(e) => handleNameSave(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleNameSave((e.target as HTMLInputElement).value);
                                if (e.key === 'Escape') setEditingName(false);
                            }}
                            className="w-full bg-surface-800 border border-accent/50 rounded-lg px-2 py-1 text-lg font-bold text-surface-100 focus:outline-none"
                        />
                    ) : (
                        <h2
                            className="text-lg font-bold text-surface-100 cursor-pointer hover:text-accent-light transition-colors"
                            onClick={() => setEditingName(true)}
                        >
                            {service.name}
                        </h2>
                    )}
                    <span className="text-xs text-surface-400 uppercase tracking-wider">
                        {typeOptions.find((t) => t.value === service.type)?.label}
                    </span>
                </div>
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-3">
                <label className="text-xs text-surface-400 font-medium">Color</label>
                <input
                    type="color"
                    value={service.color}
                    onChange={(e) => updateService(service.id, { color: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-surface-600 cursor-pointer bg-transparent"
                />
                <span className="text-xs text-surface-500 font-mono">{service.color}</span>
            </div>

            {/* Type selector */}
            <div>
                <label className="text-xs text-surface-400 font-medium block mb-2">Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                    {typeOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => updateService(service.id, { type: opt.value })}
                            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-all border
                ${service.type === opt.value
                                    ? 'bg-accent/15 border-accent/30 text-accent-light'
                                    : 'bg-surface-800/50 border-surface-700/50 text-surface-400 hover:bg-surface-800 hover:text-surface-300'
                                }`}
                        >
                            <span className="text-sm">{opt.icon}</span>
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="text-xs text-surface-400 font-medium block mb-2">Description</label>
                {editingDesc ? (
                    <textarea
                        autoFocus
                        defaultValue={service.description || ''}
                        rows={3}
                        onBlur={(e) => handleDescSave(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingDesc(false);
                        }}
                        className="w-full bg-surface-800 border border-accent/50 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none resize-none"
                    />
                ) : (
                    <div
                        onClick={() => setEditingDesc(true)}
                        className="text-sm text-surface-300 bg-surface-800/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-surface-800 transition-colors min-h-[60px]"
                    >
                        {service.description || 'Click to add description...'}
                    </div>
                )}
            </div>

            {/* Links */}
            <div>
                <label className="text-xs text-surface-400 font-medium block mb-2">Links</label>
                <div className="space-y-1.5">
                    {(service.links || []).map((link, i) => (
                        <div key={i} className="flex items-center gap-2 group">
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center gap-2 text-sm text-accent-light hover:text-accent transition-colors px-3 py-1.5 rounded-lg bg-surface-800/50 hover:bg-surface-800"
                            >
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span className="truncate">{link.label}</span>
                            </a>
                            <button
                                onClick={() => handleRemoveLink(i)}
                                className="p-1 rounded-md text-surface-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add link form */}
                <div className="mt-3 space-y-2">
                    <input
                        placeholder="Label (e.g., Runbook)"
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        className="w-full bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-1.5 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent/50"
                    />
                    <div className="flex gap-2">
                        <input
                            placeholder="URL"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            className="flex-1 bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-1.5 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent/50"
                        />
                        <button
                            onClick={handleAddLink}
                            disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                            className="px-3 py-1.5 bg-accent/20 text-accent-light rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-surface-700/50">
                <button
                    onClick={() => {
                        removeService(service.id);
                        setSelectedNode(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Service
                </button>
            </div>
        </div>
    );
}
