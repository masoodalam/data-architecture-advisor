import type { AwsInfraNode, AwsServiceType } from "../types/awsCost";
import { serviceCategory } from "../logic/awsPricing";

export const awsServiceLibrary: Array<{ type: AwsServiceType; label: string; description: string }> = [
  { type: "ec2", label: "EC2", description: "Virtual compute instances" },
  { type: "rds", label: "RDS", description: "Managed relational database" },
  { type: "s3", label: "S3", description: "Object storage" },
  { type: "loadBalancer", label: "Load Balancer", description: "Application traffic distribution" },
  { type: "natGateway", label: "NAT Gateway", description: "Outbound private subnet access" },
];

export function createDefaultAwsNode(serviceType: AwsServiceType, index: number): AwsInfraNode {
  const base = {
    id: `${serviceType}-${Date.now()}-${index}`,
    serviceType,
    category: serviceCategory(serviceType),
    position: {
      x: 48 + (index % 4) * 36,
      y: 48 + (index % 5) * 32,
    },
  };

  switch (serviceType) {
    case "ec2":
      return {
        ...base,
        name: "EC2",
        config: { region: "us-east-1", instanceType: "t3.micro", hoursPerMonth: 730, quantity: 1 },
      };
    case "rds":
      return {
        ...base,
        name: "RDS",
        config: { region: "us-east-1", instanceType: "db.t3.micro", storageGb: 20, hoursPerMonth: 730 },
      };
    case "s3":
      return {
        ...base,
        name: "S3",
        config: { storageGb: 100, monthlyRequests: 100000 },
      };
    case "loadBalancer":
      return {
        ...base,
        name: "Load Balancer",
        config: { hoursPerMonth: 730 },
      };
    case "natGateway":
      return {
        ...base,
        name: "NAT Gateway",
        config: { hoursPerMonth: 730, dataProcessedGb: 100 },
      };
  }
}
