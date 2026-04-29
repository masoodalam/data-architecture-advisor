import { Trash2 } from "lucide-react";
import { calculateNodeCost, describeNodeConfig, formatUsd } from "../../logic/awsPricing";
import type { AwsInfraNode } from "../../types/awsCost";

interface ServiceNodeProps {
  node: AwsInfraNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string, event: React.PointerEvent<HTMLDivElement>) => void;
}

export function ServiceNode({ node, selected, onSelect, onDelete, onDragStart }: ServiceNodeProps) {
  return (
    <div
      onPointerDown={(event) => onDragStart(node.id, event)}
      onClick={() => onSelect(node.id)}
      className={`absolute w-56 cursor-grab touch-none rounded-md border bg-white p-4 shadow-panel transition active:cursor-grabbing ${
        selected ? "border-teal ring-4 ring-teal/15" : "border-slate-200"
      }`}
      style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{node.category}</p>
          <h3 className="mt-1 text-lg font-bold text-ink">{node.name}</h3>
        </div>
        <button
          aria-label={`Delete ${node.name}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(node.id);
          }}
          className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-sm leading-5 text-slate-600">{describeNodeConfig(node)}</p>
      <p className="mt-4 text-xl font-bold text-teal">{formatUsd(calculateNodeCost(node))}</p>
      <p className="text-xs text-slate-500">estimated monthly cost</p>
    </div>
  );
}
