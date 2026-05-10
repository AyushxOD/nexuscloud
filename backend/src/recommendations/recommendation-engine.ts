import { ec2Service } from '../services/ec2.js';
import { cloudWatchService } from '../services/cloudwatch.js';
import { logger } from '../utils/logger.js';
import type { EC2Instance, EBSVolume, Resource, ZombieResource, UtilizationData } from '../types/index.js';

interface InstancePricing {
  hourlyCost: number;
  monthlyEstimate: number;
}

interface VolumePricing {
  monthlyCost: number;
}

interface OptimizationResult {
  stoppedInstances: Resource[];
  unattachedVolumes: Resource[];
  zombieResources: ZombieResource[];
  utilizationData: UtilizationData[];
  totalSavings: number;
}

class RecommendationEngine {
  private instancePricingCache: Map<string, InstancePricing> = new Map();
  private volumePricingCache: Map<string, VolumePricing> = new Map();

  async analyzeAllResources(region?: string): Promise<OptimizationResult> {
    logger.info('Starting resource analysis', { region } as Record<string, unknown>);

    const result: OptimizationResult = {
      stoppedInstances: [],
      unattachedVolumes: [],
      zombieResources: [],
      utilizationData: [],
      totalSavings: 0,
    };

    try {
      // Analyze stopped EC2 instances
      const stoppedInstances = await ec2Service.getStoppedInstances(region);
      logger.info('Analyzing stopped instances', { count: stoppedInstances.length } as Record<string, unknown>);

      for (const instance of stoppedInstances) {
        const recommendation = this.analyzeStoppedInstance(instance);
        if (recommendation) {
          result.stoppedInstances.push(recommendation);
          result.totalSavings += recommendation.estimatedSavings;
        }
      }

      // Analyze unattached EBS volumes
      const unattachedVolumes = await ec2Service.getUnattachedVolumes(region);
      logger.info('Analyzing unattached volumes', { count: unattachedVolumes.length } as Record<string, unknown>);

      for (const volume of unattachedVolumes) {
        const recommendation = this.analyzeUnattachedVolume(volume);
        if (recommendation) {
          result.unattachedVolumes.push(recommendation);
          result.totalSavings += recommendation.estimatedSavings;
        }
      }

      // Zombie Hunter: Detect unattached EIPs
      const unattachedEIPs = await ec2Service.getUnattachedEIPs(region);
      logger.info('Zombie hunter: unattached EIPs', { count: unattachedEIPs.length } as Record<string, unknown>);
      result.zombieResources.push(...unattachedEIPs);

      // Zombie Hunter: Detect orphaned snapshots
      const orphanedSnapshots = await ec2Service.getOrphanedSnapshots(region);
      logger.info('Zombie hunter: orphaned snapshots', { count: orphanedSnapshots.length } as Record<string, unknown>);
      result.zombieResources.push(...orphanedSnapshots);

      // Get utilization data for running instances (right-sizing recommendations)
      const runningInstances = await ec2Service.getActiveInstances(region);
      const runningOnDemand = runningInstances.filter(i => i.state === 'running');
      logger.info('Fetching utilization data for right-sizing', { count: runningOnDemand.length } as Record<string, unknown>);

      for (const instance of runningOnDemand) {
        const utilization = await cloudWatchService.getEC2Utilization(instance.instanceId, region);
        if (utilization && utilization.avgValue < 20) {
          result.utilizationData.push(utilization);
          result.totalSavings += this.estimateDowngradeSavings(instance.instanceType, utilization.avgValue);
        }
      }

      logger.info('Resource analysis complete', {
        stoppedInstances: result.stoppedInstances.length,
        unattachedVolumes: result.unattachedVolumes.length,
        totalSavings: result.totalSavings,
      } as Record<string, unknown>);

      return result;
    } catch (error) {
      logger.error('Resource analysis failed', error);
      throw error;
    }
  }

  private analyzeStoppedInstance(instance: EC2Instance): Resource | null {
    const pricing = this.getInstancePricing(instance.instanceType);
    const monthlySavings = pricing.monthlyEstimate;

    logger.debug('Analyzing stopped instance', {
      instanceId: instance.instanceId,
      type: instance.instanceType,
      monthlySavings,
    } as Record<string, unknown>);

    return {
      resourceId: instance.instanceId,
      resourceType: 'ec2-instance',
      recommendationType: 'stopped-instance',
      description: `Stopped EC2 instance (${instance.instanceType}) - Consider termination if not needed`,
      estimatedSavings: Math.round(monthlySavings * 100) / 100,
      details: {
        instanceType: instance.instanceType,
        state: instance.state,
        name: instance.name,
        launchTime: instance.launchTime,
        tags: instance.tags,
        hourlyCost: pricing.hourlyCost,
        monthlyCost: pricing.monthlyEstimate,
      },
      region: instance.region,
      createdAt: new Date().toISOString(),
    };
  }

  private analyzeUnattachedVolume(volume: EBSVolume): Resource | null {
    if (!volume.size || volume.size === 0) {
      return null;
    }

    const pricing = this.getVolumePricing(volume.volumeType || 'gp2', volume.size);
    const monthlySavings = pricing.monthlyCost;

    logger.debug('Analyzing unattached volume', {
      volumeId: volume.volumeId,
      size: volume.size,
      type: volume.volumeType,
      monthlySavings,
    } as Record<string, unknown>);

    return {
      resourceId: volume.volumeId,
      resourceType: 'ebs-volume',
      recommendationType: 'unattached-volume',
      description: `Unattached EBS volume (${volume.volumeType}, ${volume.size} GB) - Consider deletion`,
      estimatedSavings: Math.round(monthlySavings * 100) / 100,
      details: {
        volumeType: volume.volumeType,
        size: volume.size,
        state: volume.state,
        attachments: volume.attachments,
        tags: volume.tags,
      },
      region: volume.region,
      createdAt: new Date().toISOString(),
    };
  }

  private getInstancePricing(instanceType: string): InstancePricing {
    const cached = this.instancePricingCache.get(instanceType);
    if (cached) {
      return cached;
    }

    const hourlyCost = ec2Service.getInstanceHourlyCost(instanceType);
    const monthlyEstimate = hourlyCost * 24 * 30;

    const pricing: InstancePricing = {
      hourlyCost,
      monthlyEstimate,
    };

    this.instancePricingCache.set(instanceType, pricing);
    return pricing;
  }

  private getVolumePricing(volumeType: string, size: number): VolumePricing {
    const key = `${volumeType}-${size}`;
    const cached = this.volumePricingCache.get(key);
    if (cached) {
      return cached;
    }

    const monthlyCost = ec2Service.getVolumeMonthlyCost(size, volumeType);

    const pricing: VolumePricing = { monthlyCost };
    this.volumePricingCache.set(key, pricing);
    return pricing;
  }

  private estimateDowngradeSavings(instanceType: string, avgUtilization: number): number {
    // Estimate savings by downgrading to next smaller instance size
    const downgradeMap: Record<string, string> = {
      't3.large': 't3.medium',
      't3.medium': 't3.small',
      't3.small': 't3.micro',
      't3a.large': 't3a.medium',
      't3a.medium': 't3a.small',
      'm5.xlarge': 'm5.large',
      'c5.xlarge': 'c5.large',
    };

    const smallerType = downgradeMap[instanceType];
    if (!smallerType) return 0;

    const currentCost = ec2Service.getInstanceHourlyCost(instanceType);
    const smallerCost = ec2Service.getInstanceHourlyCost(smallerType);
    const savings = (currentCost - smallerCost) * 24 * 30;

    return Math.round(savings * 100) / 100;
  }

  generateSummary(result: OptimizationResult): {
    totalRecommendations: number;
    estimatedMonthlySavings: number;
    byType: Record<string, { count: number; savings: number }>;
  } {
    const byType: Record<string, { count: number; savings: number }> = {
      'stopped-instance': {
        count: result.stoppedInstances.length,
        savings: result.stoppedInstances.reduce((sum, r) => sum + r.estimatedSavings, 0),
      },
      'unattached-volume': {
        count: result.unattachedVolumes.length,
        savings: result.unattachedVolumes.reduce((sum, r) => sum + r.estimatedSavings, 0),
      },
      'zombie-resource': {
        count: result.zombieResources.length,
        savings: result.zombieResources.reduce((sum, r) => sum + r.estimatedSavings, 0),
      },
    };

    return {
      totalRecommendations: result.stoppedInstances.length + result.unattachedVolumes.length + result.zombieResources.length,
      estimatedMonthlySavings: Math.round(result.totalSavings * 100) / 100,
      byType,
    };
  }
}

export const recommendationEngine = new RecommendationEngine();