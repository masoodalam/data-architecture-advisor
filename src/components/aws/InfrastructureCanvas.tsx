import { MousePointer2 } from "lucide-react";
import { useRef, useState } from "react";
import { ServiceNode } from "./ServiceNode";
import type { AwsInfraNode } from "../../types/awsCost";

interface InfrastructureCanvasProps {
  nodes: AwsInfraNode[];
  selectedNodeId?: string;
  onSelectNode: (id?: string) => void;
  onDeleteNode: (id: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
}

export function InfrastructureCanvas({ nodes, selectedNodeId, onSelectNode, onDeleteNode, onMoveNode }: InfrastructureCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number }>();

  function handleDragStart(id: string, event: React.PointerEvent<HTMLDivElement>) {
    const node = nodes.find((item) => item.id === id);
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!node || !bounds) return;
    onSelectNode(id);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging({
      id,
      offsetX: event.clientX - bounds.left - node.position.x,
      offsetY: event.clientY - bounds.top - node.position.y,
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !canvasRef.current) return;
    const bounds = canvasRef.current.getBoundingClientRect();
    const x = Math.max(12, Math.min(bounds.width - 240, event.clientX - bounds.left - dragging.offsetX));
    const y = Math.max(12, Math.min(bounds.height - 170, event.clientY - bounds.top - dragging.offsetY));
    onMoveNode(dragging.id, x, y);
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visual infrastructure canvas</p>
          <h2 className="text-xl font-bold text-ink">Architecture sketch</h2>
        </div>
        <p className="text-sm text-slate-500">{nodes.length} service{nodes.length === 1 ? "" : "s"}</p>
      </div>

      <div
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragging(undefined)}
        onPointerCancel={() => setDragging(undefined)}
        onClick={(event) => {
          if (event.target === event.currentTarget) onSelectNode(undefined);
        }}
        className="relative mt-4 min-h-[620px] overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 [background-image:linear-gradient(rgba(15,23,42,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] [background-size:28px_28px]"
      >
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <MousePointer2 className="mx-auto h-10 w-10 text-teal" />
              <h3 className="mt-4 text-xl font-bold text-ink">Start by adding an AWS service</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Click EC2, RDS, S3, Load Balancer, or NAT Gateway from the service library. Nodes can be selected, dragged, configured, and deleted.
              </p>
            </div>
          </div>
        )}
        {nodes.map((node) => (
          <ServiceNode
            key={node.id}
            node={node}
            selected={node.id === selectedNodeId}
            onSelect={onSelectNode}
            onDelete={onDeleteNode}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </section>
  );
}
