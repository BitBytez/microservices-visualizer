import { useAppStore } from '../../store/store';
import NodeInspector from './NodeInspector';
import EdgeInspector from './EdgeInspector';

export default function RightPanel() {
    const { selectedNodeId, selectedEdgeId, setSelectedNode, setSelectedEdge } = useAppStore();

    const hasSelection = selectedNodeId || selectedEdgeId;

    if (!hasSelection) {
        return (
            <div className="w-[380px] min-w-[380px] h-full bg-surface-900 border-l border-surface-700/50 flex items-center justify-center">
                <div className="text-center px-8">
                    <div className="text-4xl mb-3 opacity-30">◈</div>
                    <p className="text-surface-400 text-sm">
                        Select a node or edge to inspect
                    </p>
                    <p className="text-surface-500 text-xs mt-1">
                        Click on a service or connection in the graph
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[380px] min-w-[380px] h-full bg-surface-900 border-l border-surface-700/50 flex flex-col animate-slide-in-right overflow-hidden">
            {/* Close button */}
            <div className="flex items-center justify-end p-2">
                <button
                    onClick={() => {
                        setSelectedNode(null);
                        setSelectedEdge(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {selectedNodeId && <NodeInspector />}
                {selectedEdgeId && <EdgeInspector />}
            </div>
        </div>
    );
}
