// Core Types
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

// Optimization Report Types
export interface OptimizationReport {
  summary: OptimizationSummary;
  currentSpend: CostData | null;
  recommendations: Resource[];
  ec2Instances: EC2Instance[];
  topServices: ServiceCost[];
  zombieResources: ZombieResource[];
  utilizationData: UtilizationData[];
  serviceDetails: ServiceDetail[];
  timestamp: string;
}

export interface OptimizationSummary {
  totalRecommendations: number;
  estimatedMonthlySavings: number;
  scannedResources: {
    ec2Instances: number;
    ebsVolumes: number;
  };
}

export interface CloudOptimizerResponse {
  success: boolean;
  data?: OptimizationReport;
  error?: string;
  requestId?: string;
}

// Service Types
export interface ServiceCost {
  serviceName: string;
  cost: number;
  currency: string;
  period: {
    start: string;
    end: string;
  };
}

export interface ServiceDetail {
  serviceName: string;
  resources: ServiceResource[];
  cost: number;
}

export interface ServiceResource {
  name: string;
  createdAt?: string;
  region?: string;
  details?: Record<string, unknown>;
}

// Utilization Types
export interface UtilizationData {
  resourceId: string;
  resourceType: 'ec2' | 'rds';
  metric: 'cpu' | 'memory' | 'iops' | 'throughput';
  avgValue: number;
  maxValue: number;
  period: string;
}

// Zombie Resource Types
export interface ZombieResource {
  resourceId: string;
  resourceType: 'eip' | 'snapshot' | 'elb';
  description: string;
  estimatedSavings: number;
  region: string;
  createdAt: string;
}

// Deep Dive Types
export interface DeepDiveRecommendation {
  resourceId: string;
  resourceType: string;
  recommendation: string;
  currentUtilization?: UtilizationData;
  action: 'upgrade' | 'downgrade' | 'terminate' | 'resize';
  cliCommand: string;
  estimatedSavings?: number;
}

// UI State Types
export type MetricType = 'spend' | 'score' | 'savings' | 'resources';

export interface FilterState {
  states: string[];
  types: string[];
  regions: string[];
}

export interface DrawerState {
  isOpen: boolean;
  title: string;
  type: 'instance' | 'service' | 'zombie' | null;
}

// API Types
export interface APIError {
  error: string;
  message?: string;
  code?: string;
}

// Component Prop Types
export interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  isActive?: boolean;
  delay?: number;
}

export interface ServiceLeaderboardProps {
  services: ServiceCost[];
  serviceDetails: ServiceDetail[];
  onSelectService: (service: ServiceCost) => void;
}

export interface ZombiePanelProps {
  zombies: ZombieResource[];
  onSelectZombie: (zombie: ZombieResource) => void;
}

export interface InstanceRowProps {
  instance: EC2Instance;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick?: () => void;
  isHighlighted?: boolean;
}

export interface EmptyStateProps {
  type: 'instances' | 'recommendations';
  action?: () => void;
}

// Animation Variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
};

// Utility Types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

// Function Types
export type AsyncFunction<T> = () => Promise<T>;

export type VoidFunction = () => void;