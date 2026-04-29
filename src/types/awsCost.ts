export type AwsServiceType = "ec2" | "rds" | "s3" | "loadBalancer" | "natGateway";

export type CostCategory = "Compute" | "Database" | "Storage" | "Network";

export interface NodePosition {
  x: number;
  y: number;
}

export interface Ec2Config {
  region: string;
  instanceType: "t3.micro" | "t3.small";
  hoursPerMonth: number;
  quantity: number;
}

export interface RdsConfig {
  region: string;
  instanceType: "db.t3.micro";
  storageGb: number;
  hoursPerMonth: number;
}

export interface S3Config {
  storageGb: number;
  monthlyRequests: number;
}

export interface LoadBalancerConfig {
  hoursPerMonth: number;
}

export interface NatGatewayConfig {
  hoursPerMonth: number;
  dataProcessedGb: number;
}

export type AwsNodeConfig = Ec2Config | RdsConfig | S3Config | LoadBalancerConfig | NatGatewayConfig;

export interface AwsInfraNode {
  id: string;
  serviceType: AwsServiceType;
  name: string;
  category: CostCategory;
  position: NodePosition;
  config: AwsNodeConfig;
}

export interface CostBreakdown {
  Compute: number;
  Database: number;
  Storage: number;
  Network: number;
}

export interface ProjectCost {
  total: number;
  breakdown: CostBreakdown;
}
