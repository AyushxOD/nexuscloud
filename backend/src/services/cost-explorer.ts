import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageCommandInput,
} from '@aws-sdk/client-cost-explorer';
import { logger } from '../utils/logger.js';
import { AWSServiceError } from '../utils/errors.js';
import type { CostData, ServiceCost } from '../types/index.js';

export class CostExplorerService {
  private client: CostExplorerClient;

  constructor() {
    this.client = new CostExplorerClient({
      region: process.env.AWS_REGION || 'us-east-1',
      maxAttempts: 3,
    });
  }

  async getCurrentMonthSpend(): Promise<CostData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const params: GetCostAndUsageCommandInput = {
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
      ],
    };

    try {
      logger.info('Fetching current month spending', { startDate, endDate } as Record<string, unknown>);

      const command = new GetCostAndUsageCommand(params);
      const response = await this.client.send(command);

      const resultsByTime = response.ResultsByTime || [];
      let totalAmount = '0';

      if (resultsByTime.length > 0) {
        const groups = resultsByTime[0].Groups || [];
        totalAmount = groups.reduce((sum: number, group: any) => {
          const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
          return sum + amount;
        }, 0).toFixed(2);
      }

      logger.info('Spending fetched successfully', { amount: totalAmount } as Record<string, unknown>);

      return {
        amount: totalAmount,
        unit: 'USD',
        period: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      throw new AWSServiceError(
        'Failed to fetch cost data',
        'CostExplorer',
        'GetCostAndUsage',
        error,
        true
      );
    }
  }

  async getServiceCosts(service: string): Promise<CostData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const params: GetCostAndUsageCommandInput = {
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      Filter: {
        Dimensions: {
          Key: 'SERVICE',
          Values: [service],
        },
      },
    };

    try {
      logger.info('Fetching service-specific costs', { service } as Record<string, unknown>);

      const command = new GetCostAndUsageCommand(params);
      const response = await this.client.send(command);

      const resultsByTime = response.ResultsByTime || [];
      let totalAmount = '0';

      if (resultsByTime.length > 0) {
        const groups = resultsByTime[0].Groups || [];
        totalAmount = groups.reduce((sum: number, group: any) => {
          const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
          return sum + amount;
        }, 0).toFixed(2);
      }

      return {
        amount: totalAmount,
        unit: 'USD',
        period: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      throw new AWSServiceError(
        `Failed to fetch costs for service: ${service}`,
        'CostExplorer',
        'GetCostAndUsage',
        error,
        true
      );
    }
  }

  async getTopServices(limit: number = 10): Promise<ServiceCost[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const params: GetCostAndUsageCommandInput = {
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
      ],
    };

    try {
      logger.info('Fetching top services by cost', { limit } as Record<string, unknown>);

      const command = new GetCostAndUsageCommand(params);
      const response = await this.client.send(command);

      const resultsByTime = response.ResultsByTime || [];
      const services: ServiceCost[] = [];

      if (resultsByTime.length > 0) {
        const groups = resultsByTime[0].Groups || [];

        for (const group of groups) {
          const serviceName = group.Keys?.[0] || 'Unknown';
          const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');

          if (amount > 0) {
            services.push({
              serviceName,
              cost: amount,
              currency: 'USD',
              period: { start: startDate, end: endDate },
            });
          }
        }

        services.sort((a, b) => b.cost - a.cost);
      }

      logger.info('Top services fetched', { count: services.length } as Record<string, unknown>);

      return services.slice(0, limit);
    } catch (error) {
      throw new AWSServiceError(
        'Failed to fetch top services',
        'CostExplorer',
        'GetCostAndUsage',
        error,
        true
      );
    }
  }
}

export const costExplorerService = new CostExplorerService();