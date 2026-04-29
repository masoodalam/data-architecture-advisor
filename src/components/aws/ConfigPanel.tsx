import { calculateNodeCost, formatUsd } from "../../logic/awsPricing";
import type {
  AwsInfraNode,
  Ec2Config,
  LoadBalancerConfig,
  NatGatewayConfig,
  RdsConfig,
  S3Config,
} from "../../types/awsCost";

interface ConfigPanelProps {
  node?: AwsInfraNode;
  onUpdateNode: (node: AwsInfraNode) => void;
}

export function ConfigPanel({ node, onUpdateNode }: ConfigPanelProps) {
  if (!node) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Configuration</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Select a node</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Choose a service on the canvas to edit its sizing assumptions and see the monthly estimate update.
        </p>
      </section>
    );
  }

  function updateConfig(nextConfig: AwsInfraNode["config"]) {
    if (!node) return;
    onUpdateNode({ ...node, config: nextConfig });
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Configuration</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">{node.name}</h2>
        <span className="rounded-full bg-teal/10 px-2 py-1 text-xs font-bold text-teal">{formatUsd(calculateNodeCost(node))}</span>
      </div>
      <div className="mt-4 space-y-4">
        {node.serviceType === "ec2" && <Ec2Fields config={node.config as Ec2Config} onChange={updateConfig} />}
        {node.serviceType === "rds" && <RdsFields config={node.config as RdsConfig} onChange={updateConfig} />}
        {node.serviceType === "s3" && <S3Fields config={node.config as S3Config} onChange={updateConfig} />}
        {node.serviceType === "loadBalancer" && <LoadBalancerFields config={node.config as LoadBalancerConfig} onChange={updateConfig} />}
        {node.serviceType === "natGateway" && <NatGatewayFields config={node.config as NatGatewayConfig} onChange={updateConfig} />}
      </div>
    </section>
  );
}

function Ec2Fields({ config, onChange }: { config: Ec2Config; onChange: (config: Ec2Config) => void }) {
  return (
    <>
      <RegionField value={config.region} onChange={(region) => onChange({ ...config, region })} />
      <SelectField label="Instance type" value={config.instanceType} options={["t3.micro", "t3.small"]} onChange={(instanceType) => onChange({ ...config, instanceType: instanceType as Ec2Config["instanceType"] })} />
      <NumberField label="Hours per month" value={config.hoursPerMonth} onChange={(hoursPerMonth) => onChange({ ...config, hoursPerMonth })} />
      <NumberField label="Quantity" value={config.quantity} onChange={(quantity) => onChange({ ...config, quantity })} />
    </>
  );
}

function RdsFields({ config, onChange }: { config: RdsConfig; onChange: (config: RdsConfig) => void }) {
  return (
    <>
      <RegionField value={config.region} onChange={(region) => onChange({ ...config, region })} />
      <SelectField label="Instance type" value={config.instanceType} options={["db.t3.micro"]} onChange={(instanceType) => onChange({ ...config, instanceType: instanceType as RdsConfig["instanceType"] })} />
      <NumberField label="Storage GB" value={config.storageGb} onChange={(storageGb) => onChange({ ...config, storageGb })} />
      <NumberField label="Hours per month" value={config.hoursPerMonth} onChange={(hoursPerMonth) => onChange({ ...config, hoursPerMonth })} />
    </>
  );
}

function S3Fields({ config, onChange }: { config: S3Config; onChange: (config: S3Config) => void }) {
  return (
    <>
      <NumberField label="Storage GB" value={config.storageGb} onChange={(storageGb) => onChange({ ...config, storageGb })} />
      <NumberField label="Monthly requests" value={config.monthlyRequests} onChange={(monthlyRequests) => onChange({ ...config, monthlyRequests })} />
    </>
  );
}

function LoadBalancerFields({ config, onChange }: { config: LoadBalancerConfig; onChange: (config: LoadBalancerConfig) => void }) {
  return <NumberField label="Hours per month" value={config.hoursPerMonth} onChange={(hoursPerMonth) => onChange({ ...config, hoursPerMonth })} />;
}

function NatGatewayFields({ config, onChange }: { config: NatGatewayConfig; onChange: (config: NatGatewayConfig) => void }) {
  return (
    <>
      <NumberField label="Hours per month" value={config.hoursPerMonth} onChange={(hoursPerMonth) => onChange({ ...config, hoursPerMonth })} />
      <NumberField label="Data processed GB" value={config.dataProcessedGb} onChange={(dataProcessedGb) => onChange({ ...config, dataProcessedGb })} />
    </>
  );
}

function RegionField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <SelectField label="Region" value={value} options={["us-east-1", "us-west-2", "eu-west-1", "eu-central-1"]} onChange={onChange} />;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal/20 focus:ring-4">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal/20 focus:ring-4"
      />
    </label>
  );
}
