import { ReactFlowProvider } from '@xyflow/react';
import GraphCanvas from './components/GraphCanvas';
import LeftSidebar from './components/panels/LeftSidebar';
import RightPanel from './components/panels/RightPanel';
import ConfigToolbar from './components/ConfigToolbar';
import AddServiceModal from './components/modals/AddServiceModal';
import { useAppStore } from './store/store';

export default function App() {
  const { showAddServiceModal } = useAppStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-950 text-surface-200 overflow-hidden">
      {/* Top toolbar */}
      <ConfigToolbar />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <LeftSidebar />

        {/* Graph canvas */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <GraphCanvas />
          </ReactFlowProvider>
        </div>

        {/* Right panel */}
        <RightPanel />
      </div>

      {/* Modals */}
      {showAddServiceModal && <AddServiceModal />}
    </div>
  );
}
