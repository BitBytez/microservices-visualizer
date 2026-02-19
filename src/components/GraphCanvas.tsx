import { useCallback, useMemo, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection as RFConnection,
    type Node,
    type Edge,
    BackgroundVariant,
    type OnNodesChange,
    type OnEdgesChange,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ServiceNodeComponent from './nodes/ServiceNode';
import DependencyEdgeComponent from './edges/DependencyEdge';
import { useAppStore } from '../store/store';
import type { Connection } from '../types';

const nodeTypes = { serviceNode: ServiceNodeComponent };
const edgeTypes = { dependencyEdge: DependencyEdgeComponent };

// Layout helpers
function getNodePosition(index: number, total: number) {
    // Arrange in a grid-like pattern
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    const spacing = 250;
    return {
        x: col * spacing + (row % 2 === 1 ? spacing / 2 : 0),
        y: row * spacing,
    };
}

export default function GraphCanvas() {
    const {
        services,
        connections,
        selectedNodeId,
        selectedEdgeId,
        setSelectedNode,
        setSelectedEdge,
        addConnection,
        addService,
        setShowAddServiceModal,
    } = useAppStore();

    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const initialNodes: Node[] = useMemo(
        () =>
            services.map((s, i) => ({
                id: s.id,
                type: 'serviceNode',
                position: getNodePosition(i, services.length),
                data: {
                    label: s.name,
                    serviceType: s.type,
                    color: s.color,
                    description: s.description,
                    isSelected: s.id === selectedNodeId,
                },
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [services]
    );

    const initialEdges: Edge[] = useMemo(
        () =>
            connections.map((c) => ({
                id: c.id,
                source: c.source,
                target: c.target,
                type: 'dependencyEdge',
                data: {
                    dashboardCount: c.dashboards.length,
                    label: c.label,
                    isSelected: c.id === selectedEdgeId,
                },
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [connections]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Keep nodes/edges in sync with store
    useMemo(() => {
        setNodes(
            services.map((s, i) => {
                const existing = nodes.find((n) => n.id === s.id);
                return {
                    id: s.id,
                    type: 'serviceNode',
                    position: existing?.position ?? getNodePosition(i, services.length),
                    data: {
                        label: s.name,
                        serviceType: s.type,
                        color: s.color,
                        description: s.description,
                        isSelected: s.id === selectedNodeId,
                    },
                };
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [services, selectedNodeId, setNodes]);

    useMemo(() => {
        setEdges(
            connections.map((c) => ({
                id: c.id,
                source: c.source,
                target: c.target,
                type: 'dependencyEdge',
                data: {
                    dashboardCount: c.dashboards.length,
                    label: c.label,
                    isSelected: c.id === selectedEdgeId,
                },
            }))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connections, selectedEdgeId, setEdges]);

    const onConnect = useCallback(
        (params: RFConnection) => {
            const newConn: Connection = {
                id: `conn-${Date.now()}`,
                source: params.source,
                target: params.target,
                dashboards: [],
            };
            addConnection(newConn);
            setEdges((eds) => addEdge({ ...params, type: 'dependencyEdge', id: newConn.id, data: { dashboardCount: 0 } }, eds));
        },
        [addConnection, setEdges]
    );

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            setSelectedNode(node.id);
        },
        [setSelectedNode]
    );

    const onEdgeClick = useCallback(
        (_: React.MouseEvent, edge: Edge) => {
            setSelectedEdge(edge.id);
        },
        [setSelectedEdge]
    );

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);
    }, [setSelectedNode, setSelectedEdge]);

    const { screenToFlowPosition } = useReactFlow();

    const onDoubleClick = useCallback(
        (event: React.MouseEvent) => {
            // Double-click to add a new node
            setShowAddServiceModal(true);
        },
        [setShowAddServiceModal]
    );

    const handleNodesChange: OnNodesChange = useCallback(
        (changes) => {
            onNodesChange(changes);
        },
        [onNodesChange]
    );

    const handleEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            onEdgesChange(changes);
        },
        [onEdgesChange]
    );

    return (
        <div ref={reactFlowWrapper} className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                onDoubleClick={onDoubleClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    type: 'dependencyEdge',
                }}
                proOptions={{ hideAttribution: true }}
                className="bg-surface-950"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="#1e293b"
                />
                <Controls
                    className="!bg-surface-800 !border-surface-600 !rounded-xl !shadow-xl [&>button]:!bg-surface-700 [&>button]:!border-surface-600 [&>button]:!text-surface-300 [&>button:hover]:!bg-surface-600"
                />
                <MiniMap
                    nodeColor={(node) => {
                        const data = node.data as { color?: string };
                        return data?.color ?? '#64748b';
                    }}
                    className="!bg-surface-800/80 !border-surface-600 !rounded-xl"
                    maskColor="rgba(15, 23, 42, 0.7)"
                />
            </ReactFlow>
        </div>
    );
}
