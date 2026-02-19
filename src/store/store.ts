import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, ServiceNode, Connection, Dashboard } from '../types';
import { defaultConfig } from '../data/mockData';

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            services: defaultConfig.services,
            connections: defaultConfig.connections,
            selectedNodeId: null,
            selectedEdgeId: null,
            showAddServiceModal: false,
            showAddConnectionModal: false,

            setSelectedNode: (id) =>
                set({ selectedNodeId: id, selectedEdgeId: id ? null : get().selectedEdgeId }),

            setSelectedEdge: (id) =>
                set({ selectedEdgeId: id, selectedNodeId: id ? null : get().selectedNodeId }),

            addService: (service: ServiceNode) =>
                set((state) => ({ services: [...state.services, service] })),

            updateService: (id, updates) =>
                set((state) => ({
                    services: state.services.map((s) =>
                        s.id === id ? { ...s, ...updates } : s
                    ),
                })),

            removeService: (id) =>
                set((state) => ({
                    services: state.services.filter((s) => s.id !== id),
                    connections: state.connections.filter(
                        (c) => c.source !== id && c.target !== id
                    ),
                    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
                })),

            addConnection: (connection: Connection) =>
                set((state) => ({ connections: [...state.connections, connection] })),

            removeConnection: (id) =>
                set((state) => ({
                    connections: state.connections.filter((c) => c.id !== id),
                    selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
                })),

            addDashboard: (connectionId, dashboard: Dashboard) =>
                set((state) => ({
                    connections: state.connections.map((c) =>
                        c.id === connectionId
                            ? { ...c, dashboards: [...c.dashboards, dashboard] }
                            : c
                    ),
                })),

            updateDashboard: (connectionId, dashboardId, updates) =>
                set((state) => ({
                    connections: state.connections.map((c) =>
                        c.id === connectionId
                            ? {
                                ...c,
                                dashboards: c.dashboards.map((d) =>
                                    d.id === dashboardId ? { ...d, ...updates } : d
                                ),
                            }
                            : c
                    ),
                })),

            removeDashboard: (connectionId, dashboardId) =>
                set((state) => ({
                    connections: state.connections.map((c) =>
                        c.id === connectionId
                            ? {
                                ...c,
                                dashboards: c.dashboards.filter((d) => d.id !== dashboardId),
                            }
                            : c
                    ),
                })),

            setShowAddServiceModal: (show) => set({ showAddServiceModal: show }),
            setShowAddConnectionModal: (show) => set({ showAddConnectionModal: show }),

            resetToDefaults: () =>
                set({
                    services: defaultConfig.services,
                    connections: defaultConfig.connections,
                    selectedNodeId: null,
                    selectedEdgeId: null,
                }),

            exportConfig: () => {
                const { services, connections } = get();
                return { services, connections };
            },

            importConfig: (config) =>
                set({
                    services: config.services,
                    connections: config.connections,
                    selectedNodeId: null,
                    selectedEdgeId: null,
                }),
        }),
        {
            name: 'microservice-graph-storage',
            partialize: (state) => ({
                services: state.services,
                connections: state.connections,
            }),
        }
    )
);
