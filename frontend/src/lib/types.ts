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
  timestamp: string;
}

export interface CloudOptimizerResponse {
  success: boolean;
  data?: OptimizationReport;
  error?: string;
  requestId?: string;
}