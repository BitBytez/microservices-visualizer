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

const colorPresets = [
    '#6366f1', '#f43f5e', '#8b5cf6', '#f97316', '#10b981',
    '#eab308', '#06b6d4', '#ec4899', '#14b8a6', '#3b82f6',
    '#22c55e', '#ef4444', '#a855f7',
];

export default function AddServiceModal() {
    const { addService, setShowAddServiceModal } = useAppStore();
    const [name, setName] = useState('');
    const [type, setType] = useState<ServiceType>('microservice');
    const [color, setColor] = useState('#6366f1');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        addService({
            id: `svc-${Date.now()}`,
            name: name.trim(),
            type,
            color,
            description: description.trim() || undefined,
        });
        setShowAddServiceModal(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-800 border border-surface-600/50 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in">
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/50">
                    <h3 className="text-lg font-bold text-surface-100">Add Service</h3>
                    <button
                        onClick={() => setShowAddServiceModal(false)}
                        className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="text-xs text-surface-400 font-medium block mb-1.5">Service Name *</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., User Service"
                            className="w-full bg-surface-900 border border-surface-600/50 rounded-lg px-3 py-2.5 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="text-xs text-surface-400 font-medium block mb-1.5">Type</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {typeOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setType(opt.value)}
                                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs transition-all border
                    ${type === opt.value
                                            ? 'bg-accent/15 border-accent/30 text-accent-light'
                                            : 'bg-surface-900/50 border-surface-700/50 text-surface-400 hover:bg-surface-900 hover:text-surface-300'
                                        }`}
                                >
                                    <span className="text-base">{opt.icon}</span>
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-xs text-surface-400 font-medium block mb-1.5">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {colorPresets.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-lg border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-7 h-7 rounded-lg border border-surface-600 cursor-pointer bg-transparent"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs text-surface-400 font-medium block mb-1.5">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            rows={2}
                            className="w-full bg-surface-900 border border-surface-600/50 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent/50 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAddServiceModal(false)}
                            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-surface-300 bg-surface-700 hover:bg-surface-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Add Service
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
