import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, ServiceNode, Connection, Dashboard, SavedDiagram } from '../types';
import { defaultConfig } from '../data/mockData';
import * as db from '../storage/diagramStorage';

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            services: defaultConfig.services,
            connections: defaultConfig.connections,
            selectedNodeId: null,
            selectedEdgeId: null,
            pinnedEdgeIds: [],
            animationsEnabled: true,
            showAddServiceModal: false,
            showAddConnectionModal: false,

            // Multi-diagram state
            savedDiagrams: [],
            activeDiagramId: null,

            setSelectedNode: (id) =>
                set({ selectedNodeId: id, selectedEdgeId: id ? null : get().selectedEdgeId }),

            setSelectedEdge: (id) =>
                set({ selectedEdgeId: id, selectedNodeId: id ? null : get().selectedNodeId }),

            togglePinEdge: (id) =>
                set((state) => ({
                    pinnedEdgeIds: state.pinnedEdgeIds.includes(id)
                        ? state.pinnedEdgeIds.filter((eid) => eid !== id)
                        : [...state.pinnedEdgeIds, id],
                })),

            unpinAllEdges: () => set({ pinnedEdgeIds: [] }),

            toggleAnimations: () =>
                set((state) => ({ animationsEnabled: !state.animationsEnabled })),

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

            resetToDefaults: () => {
                set({
                    services: defaultConfig.services,
                    connections: defaultConfig.connections,
                    selectedNodeId: null,
                    selectedEdgeId: null,
                    pinnedEdgeIds: [],
                    activeDiagramId: null,
                });
            },

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
                    pinnedEdgeIds: [],
                }),

            // ─── Diagram management ───────────────────────────────
            refreshDiagramList: async () => {
                const diagrams = await db.getAllDiagrams();
                set({ savedDiagrams: diagrams });
            },

            saveDiagram: async (name, nodePositions, edgeOffsets) => {
                const { services, connections, activeDiagramId, savedDiagrams } = get();
                const now = Date.now();

                // If we have an active diagram, update it
                const existingDiagram = activeDiagramId
                    ? savedDiagrams.find((d) => d.id === activeDiagramId)
                    : null;

                const diagram: SavedDiagram = {
                    id: existingDiagram?.id ?? `diagram-${now}`,
                    name,
                    services,
                    connections,
                    nodePositions,
                    edgeOffsets,
                    createdAt: existingDiagram?.createdAt ?? now,
                    updatedAt: now,
                };

                await db.putDiagram(diagram);
                const diagrams = await db.getAllDiagrams();
                set({ savedDiagrams: diagrams, activeDiagramId: diagram.id });
            },

            loadDiagram: async (id) => {
                const diagram = await db.getDiagram(id);
                if (!diagram) return;
                set({
                    services: diagram.services,
                    connections: diagram.connections,
                    activeDiagramId: diagram.id,
                    selectedNodeId: null,
                    selectedEdgeId: null,
                    pinnedEdgeIds: [],
                });
                // Positions/offsets are loaded by the components via store
            },

            deleteDiagram: async (id) => {
                await db.deleteDiagram(id);
                const diagrams = await db.getAllDiagrams();
                const { activeDiagramId } = get();
                set({
                    savedDiagrams: diagrams,
                    activeDiagramId: activeDiagramId === id ? null : activeDiagramId,
                });
            },

            renameDiagram: async (id, name) => {
                const diagram = await db.getDiagram(id);
                if (!diagram) return;
                diagram.name = name;
                diagram.updatedAt = Date.now();
                await db.putDiagram(diagram);
                const diagrams = await db.getAllDiagrams();
                set({ savedDiagrams: diagrams });
            },
        }),
        {
            name: 'microservice-graph-storage',
            partialize: (state) => ({
                services: state.services,
                connections: state.connections,
                animationsEnabled: state.animationsEnabled,
                activeDiagramId: state.activeDiagramId,
            }),
        }
    )
);
