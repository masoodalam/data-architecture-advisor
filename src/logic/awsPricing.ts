import type {
  AwsInfraNode,
  AwsServiceType,
  CostBreakdown,
  CostCategory,
  Ec2Config,
  LoadBalancerConfig,
  NatGatewayConfig,
  ProjectCost,
  RdsConfig,
  S3Config,
} from "../types/awsCost";

export const awsPricing = {
  ec2Hourly: {
    "t3.micro": 0.0104,
    "t3.small": 0.0208,
  },
  rdsHourly: {
    "db.t3.micro": 0.017,
  },
  rdsStorageGbMonth: 0.115,
  s3StorageGbMonth: 0.023,
  s3RequestPerThousand: 0.0004,
  loadBalancerHourly: 0.0225,
  natGatewayHourly: 0.045,
  natGatewayDataGb: 0.045,
};

export function calculateNodeCost(node: AwsInfraNode): number {
  switch (node.serviceType) {
    case "ec2": {
      const config = node.config as Ec2Config;
      return awsPricing.ec2Hourly[config.instanceType] * config.hoursPerMonth * config.quantity;
    }
    case "rds": {
      const config = node.config as RdsConfig;
      return awsPricing.rdsHourly[config.instanceType] * config.hoursPerMonth + awsPricing.rdsStorageGbMonth * config.storageGb;
    }
    case "s3": {
      const config = node.config as S3Config;
      return awsPricing.s3StorageGbMonth * config.storageGb + awsPricing.s3RequestPerThousand * (config.monthlyRequests / 1000);
    }
    case "loadBalancer": {
      const config = node.config as LoadBalancerConfig;
      return awsPricing.loadBalancerHourly * config.hoursPerMonth;
    }
    case "natGateway": {
      const config = node.config as NatGatewayConfig;
      return awsPricing.natGatewayHourly * config.hoursPerMonth + awsPricing.natGatewayDataGb * config.dataProcessedGb;
    }
  }
}

export function calculateProjectCost(nodes: AwsInfraNode[]): ProjectCost {
  const breakdown: CostBreakdown = {
    Compute: 0,
    Database: 0,
    Storage: 0,
    Network: 0,
  };

  nodes.forEach((node) => {
    breakdown[node.category] += calculateNodeCost(node);
  });

  return {
    total: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown,
  };
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function describeNodeConfig(node: AwsInfraNode): string {
  switch (node.serviceType) {
    case "ec2": {
      const config = node.config as Ec2Config;
      return `${config.quantity} x ${config.instanceType}, ${config.hoursPerMonth} hrs/mo`;
    }
    case "rds": {
      const config = node.config as RdsConfig;
      return `${config.instanceType}, ${config.storageGb} GB, ${config.hoursPerMonth} hrs/mo`;
    }
    case "s3": {
      const config = node.config as S3Config;
      return `${config.storageGb} GB, ${config.monthlyRequests.toLocaleString()} requests/mo`;
    }
    case "loadBalancer": {
      const config = node.config as LoadBalancerConfig;
      return `${config.hoursPerMonth} hrs/mo`;
    }
    case "natGateway": {
      const config = node.config as NatGatewayConfig;
      return `${config.hoursPerMonth} hrs/mo, ${config.dataProcessedGb} GB processed`;
    }
  }
}

export function serviceCategory(serviceType: AwsServiceType): CostCategory {
  if (serviceType === "ec2") return "Compute";
  if (serviceType === "rds") return "Database";
  if (serviceType === "s3") return "Storage";
  return "Network";
}
