import { ArrowLeft, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { ConfigPanel } from "../components/aws/ConfigPanel";
import { CostSummary } from "../components/aws/CostSummary";
import { InfrastructureCanvas } from "../components/aws/InfrastructureCanvas";
import { ServiceLibrary } from "../components/aws/ServiceLibrary";
import { createDefaultAwsNode } from "../data/awsServices";
import type { AwsInfraNode, AwsServiceType } from "../types/awsCost";

export function AwsCostDesignerPage({ onBack }: { onBack: () => void }) {
  const [nodes, setNodes] = useState<AwsInfraNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId]);

  function addService(serviceType: AwsServiceType) {
    const node = createDefaultAwsNode(serviceType, nodes.length);
    setNodes((current) => [...current, node]);
    setSelectedNodeId(node.id);
  }

  function updateNode(updatedNode: AwsInfraNode) {
    setNodes((current) => current.map((node) => (node.id === updatedNode.id ? updatedNode : node)));
  }

  function moveNode(id: string, x: number, y: number) {
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, position: { x, y } } : node)));
  }

  function deleteNode(id: string) {
    setNodes((current) => current.filter((node) => node.id !== id));
    setSelectedNodeId((current) => (current === id ? undefined : current));
  }

  return (
    <main className="min-h-screen bg-mist">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Interactive tool</p>
            <h1 className="text-2xl font-bold text-ink">AWS Infrastructure Cost Designer</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" /> Main page
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setNodes([]);
                setSelectedNodeId(undefined);
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset design
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1600px] gap-5 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)_340px] lg:px-8">
        <ServiceLibrary onAddService={addService} />
        <InfrastructureCanvas
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onDeleteNode={deleteNode}
          onMoveNode={moveNode}
        />
        <aside className="space-y-5">
          <CostSummary nodes={nodes} />
          <ConfigPanel node={selectedNode} onUpdateNode={updateNode} />
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing note</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Estimates use a local static pricing model for early planning. They exclude taxes, discounts, free tier, data transfer outside the listed services, and region-specific price variation.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
