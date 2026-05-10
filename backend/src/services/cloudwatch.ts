/**
 * CloudWatch Integration - Right-Sizing Engine
 *
 * Fetches utilization metrics for compute resources to enable
 * intelligent upsizing/downsize recommendations.
 */

import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  GetMetricStatisticsCommandInput,
} from '@aws-sdk/client-cloudwatch';
import { logger } from '../utils/logger.js';
import { AWSServiceError } from '../utils/errors.js';
import type { UtilizationData } from '../types/index.js';

export class CloudWatchService {
  private client: CloudWatchClient;

  constructor() {
    this.client = new CloudWatchClient({
      region: process.env.AWS_REGION || 'us-east-1',
      maxAttempts: 3,
    });
  }

  /**
   * Get CPU utilization for an EC2 instance over the past 7 days
   */
  async getEC2Utilization(instanceId: string, region: string = 'us-east-1'): Promise<UtilizationData | null> {
    const client = new CloudWatchClient({ region });
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

    const params: GetMetricStatisticsCommandInput = {
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
      StartTime: startTime,
      EndTime: endTime,
      Period: 3600 * 24,
      Statistics: ['Average', 'Maximum'],
    };

    try {
      const command = new GetMetricStatisticsCommand(params);
      const response = await client.send(command);

      const datapoints = response.Datapoints || [];
      if (datapoints.length === 0) {
        logger.warn('No CPU data for instance', { instanceId } as Record<string, unknown>);
        return null;
      }

      const avgValue = datapoints.reduce((sum: number, dp: any) => sum + (dp.Average || 0), 0) / datapoints.length;
      const maxValue = Math.max(...datapoints.map((dp: any) => dp.Maximum || 0));

      return {
        resourceId: instanceId,
        resourceType: 'ec2',
        metric: 'cpu',
        avgValue: Math.round(avgValue * 100) / 100,
        maxValue: Math.round(maxValue * 100) / 100,
        period: '7 days',
      };
    } catch (error) {
      logger.error('Failed to get EC2 utilization', { instanceId, error } as Record<string, unknown>);
      return null;
    }
  }

  /**
   * Get CPU utilization for an RDS instance over the past 7 days
   */
  async getRDSUtilization(dbInstanceIdentifier: string, region: string = 'us-east-1'): Promise<UtilizationData | null> {
    const client = new CloudWatchClient({ region });
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

    const params: GetMetricStatisticsCommandInput = {
      Namespace: 'AWS/RDS',
      MetricName: 'CPUUtilization',
      Dimensions: [{ Name: 'DBInstanceIdentifier', Value: dbInstanceIdentifier }],
      StartTime: startTime,
      EndTime: endTime,
      Period: 3600 * 24,
      Statistics: ['Average', 'Maximum'],
    };

    try {
      const command = new GetMetricStatisticsCommand(params);
      const response = await client.send(command);

      const datapoints = response.Datapoints || [];
      if (datapoints.length === 0) {
        return null;
      }

      const avgValue = datapoints.reduce((sum: number, dp: any) => sum + (dp.Average || 0), 0) / datapoints.length;
      const maxValue = Math.max(...datapoints.map((dp: any) => dp.Maximum || 0));

      return {
        resourceId: dbInstanceIdentifier,
        resourceType: 'rds',
        metric: 'cpu',
        avgValue: Math.round(avgValue * 100) / 100,
        maxValue: Math.round(maxValue * 100) / 100,
        period: '7 days',
      };
    } catch (error) {
      logger.error('Failed to get RDS utilization', { dbInstanceIdentifier, error } as Record<string, unknown>);
      return null;
    }
  }

  /**
   * Get all EC2 utilizations for a list of instances
   */
  async getAllEC2Utilizations(instances: { instanceId: string }[], region?: string): Promise<UtilizationData[]> {
    const results: UtilizationData[] = [];

    for (const instance of instances) {
      const utilization = await this.getEC2Utilization(instance.instanceId, region);
      if (utilization) {
        results.push(utilization);
      }
    }

    return results;
  }
}

export const cloudWatchService = new CloudWatchService();