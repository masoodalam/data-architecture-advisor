import { Cloud, Database, HardDrive, Network, Server } from "lucide-react";
import { awsServiceLibrary } from "../../data/awsServices";
import type { AwsServiceType } from "../../types/awsCost";

const icons: Record<AwsServiceType, typeof Server> = {
  ec2: Server,
  rds: Database,
  s3: HardDrive,
  loadBalancer: Network,
  natGateway: Cloud,
};

export function ServiceLibrary({ onAddService }: { onAddService: (serviceType: AwsServiceType) => void }) {
  return (
    <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AWS service library</p>
      <h2 className="mt-1 text-xl font-bold text-ink">Add services</h2>
      <div className="mt-4 space-y-2">
        {awsServiceLibrary.map((service) => {
          const Icon = icons[service.type];
          return (
            <button
              key={service.type}
              onClick={() => onAddService(service.type)}
              className="flex w-full items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-teal/50 hover:bg-teal/10"
            >
              <span className="rounded-md bg-white p-2 text-teal shadow-sm">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{service.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{service.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
