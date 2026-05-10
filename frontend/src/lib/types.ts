export interface CostData {
  amount: string;
  unit: string;
  period: {
    start: string;
    end: string;
  };
}

export interface EC2Instance {
  instanceId: string;
  instanceType: string;
  state: string;
  name: string;
  tags: Record<string, string>;
  launchTime: string;
  region: string;
}

export interface EBSVolume {
  volumeId: string;
  volumeType: string | null;
  size: number | null;
  state: string | null;
  attachments: EBSAttachment[];
  tags: Record<string, string>;
  region: string;
}

export interface EBSAttachment {
  instanceId: string | null;
  device: string | null;
  attachTime: string | null;
  deleteOnTermination: boolean | null;
}

export interface Resource {
  resourceId: string;
  resourceType: 'ec2-instance' | 'ebs-volume';
  recommendationType: string;
  description: string;
  estimatedSavings: number;
  details: Record<string, unknown>;
  region: string;
  createdAt: string;
}

export interface OptimizationReport {
  summary: {
    totalRecommendations: number;
    estimatedMonthlySavings: number;
    scannedResources: {
      ec2Instances: number;
      ebsVolumes: number;
    };
  };
  currentSpend: CostData | null;
  recommendations: Resource[];
  ec2Instances: EC2Instance[];
  topServices: ServiceCost[];
  zombieResources: ZombieResource[];
  utilizationData: UtilizationData[];
  serviceDetails: ServiceDetail[];
  timestamp: string;
}

export interface ServiceResource {
  name: string;
  createdAt?: string;
  region?: string;
  details?: Record<string, unknown>;
}

export interface ServiceDetail {
  serviceName: string;
  resources: ServiceResource[];
  cost: number;
}

export interface CloudOptimizerResponse {
  success: boolean;
  data?: OptimizationReport;
  error?: string;
  requestId?: string;
}

export interface ServiceCost {
  serviceName: string;
  cost: number;
  currency: string;
  period: {
    start: string;
    end: string;
  };
}

export interface UtilizationData {
  resourceId: string;
  resourceType: 'ec2' | 'rds';
  metric: 'cpu' | 'memory' | 'iops' | 'throughput';
  avgValue: number;
  maxValue: number;
  period: string;
}

export interface ZombieResource {
  resourceId: string;
  resourceType: 'eip' | 'snapshot' | 'elb';
  description: string;
  estimatedSavings: number;
  region: string;
  createdAt: string;
}

export interface DeepDiveRecommendation {
  resourceId: string;
  resourceType: string;
  recommendation: string;
  currentUtilization?: UtilizationData;
  action: 'upgrade' | 'downgrade' | 'terminate' | 'resize';
  cliCommand: string;
  estimatedSavings?: number;
}

export interface ExtendedOptimizationReport extends OptimizationReport {
  topServices: ServiceCost[];
  zombieResources: ZombieResource[];
  utilizationData: UtilizationData[];
}