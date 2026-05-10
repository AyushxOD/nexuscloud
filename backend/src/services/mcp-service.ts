/**
 * MCP Service Integration
 *
 * This module provides compatibility with AWS MCP server, enabling Claude
 * to inspect live infrastructure through standardized interfaces.
 *
 * MCP (Model Context Protocol) allows the AI assistant to:
 * - Query AWS resources directly
 * - Get real-time cost data
 * - Retrieve optimization recommendations
 * - Execute read-only operations
 */

import { costExplorerService } from './cost-explorer.js';
import { ec2Service } from './ec2.js';
import { resourceScannerService } from './resource-scanner.js';
import { recommendationEngine } from '../recommendations/recommendation-engine.js';
import { logger } from '../utils/logger.js';
import type { OptimizationReport, EC2Instance, EBSVolume } from '../types/index.js';

export interface MCPResourceQuery {
  resourceType: 'ec2' | 'ebs' | 'cost' | 'recommendations';
  filters?: Record<string, unknown>;
  region?: string;
}

export interface MCPResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
}

interface EC2Filters {
  state?: string;
  region?: string;
}

interface EBSFilters {
  state?: string;
  region?: string;
}

/**
 * MCP-compatible resource inspector
 * Provides standardized interface for Claude to query AWS resources
 */
export class MCPService {
  private requestId: string;

  constructor() {
    this.requestId = `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  setRequestId(id: string): void {
    this.requestId = id;
  }

  /**
   * Query EC2 instances (MCP compatible)
   * Claude can use this to inspect running/stopped instances
   */
  async queryEC2Instances(filters?: EC2Filters): Promise<MCPResponse<EC2Instance[]>> {
    logger.info('MCP: Querying EC2 instances', { filters } as Record<string, unknown>);

    try {
      let instances: EC2Instance[];
      const region = filters?.region;

      if (filters?.state === 'stopped') {
        instances = await ec2Service.getStoppedInstances(region);
      } else if (filters?.state === 'running') {
        const allInstances = await ec2Service.getActiveInstances(region);
        instances = allInstances.filter(i => i.state === 'running');
      } else {
        instances = await ec2Service.getActiveInstances(region);
      }

      return {
        success: true,
        data: instances,
        requestId: this.requestId,
      };
    } catch (error) {
      logger.error('MCP: EC2 query failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: this.requestId,
      };
    }
  }

  /**
   * Query EBS volumes (MCP compatible)
   * Claude can use this to inspect volumes and attachment states
   */
  async queryEBSVolumes(filters?: EBSFilters): Promise<MCPResponse<EBSVolume[]>> {
    logger.info('MCP: Querying EBS volumes', { filters } as Record<string, unknown>);

    try {
      let volumes: EBSVolume[];
      const region = filters?.region;

      if (filters?.state === 'available') {
        volumes = await ec2Service.getUnattachedVolumes(region);
      } else {
        volumes = await ec2Service.getVolumes(region);
      }

      if (filters?.state && filters.state !== 'available') {
        const stateFilter = filters.state;
        volumes = volumes.filter(v => v.state === stateFilter);
      }

      return {
        success: true,
        data: volumes,
        requestId: this.requestId,
      };
    } catch (error) {
      logger.error('MCP: EBS query failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: this.requestId,
      };
    }
  }

  /**
   * Query cost data (MCP compatible)
   * Claude can use this to get current spending information
   */
  async queryCosts(): Promise<MCPResponse<{ currentSpend: number; period: { start: string; end: string } }>> {
    logger.info('MCP: Querying cost data', {} as Record<string, unknown>);

    try {
      const costData = await costExplorerService.getCurrentMonthSpend();

      return {
        success: true,
        data: {
          currentSpend: parseFloat(costData.amount),
          period: costData.period,
        },
        requestId: this.requestId,
      };
    } catch (error) {
      logger.error('MCP: Cost query failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: this.requestId,
      };
    }
  }

  /**
   * Query recommendations (MCP compatible)
   * Claude can use this to get optimization recommendations
   */
  async queryRecommendations(region?: string): Promise<MCPResponse<OptimizationReport>> {
    logger.info('MCP: Querying recommendations', { region } as Record<string, unknown>);

    try {
      const analysis = await recommendationEngine.analyzeAllResources(region);
      const summary = recommendationEngine.generateSummary(analysis);
      const activeInstances = await ec2Service.getActiveInstances(region);

      const costData = await costExplorerService.getCurrentMonthSpend();
      const topServices = await costExplorerService.getTopServices(10);

      // Fetch service details
      const serviceDetails: any[] = [];
      for (const service of topServices.slice(0, 5)) {
        const detail = await resourceScannerService.getServiceResources(service.serviceName);
        if (detail.resources.length > 0) {
          serviceDetails.push(detail);
        }
      }

      const report: OptimizationReport = {
        summary: {
          totalRecommendations: summary.totalRecommendations,
          estimatedMonthlySavings: summary.estimatedMonthlySavings,
          scannedResources: {
            ec2Instances: analysis.stoppedInstances.length + activeInstances.length,
            ebsVolumes: analysis.unattachedVolumes.length + (await ec2Service.getVolumes(region)).filter(v => v.state !== 'available').length,
          },
        },
        currentSpend: costData,
        recommendations: [...analysis.stoppedInstances, ...analysis.unattachedVolumes],
        ec2Instances: activeInstances,
        topServices,
        zombieResources: analysis.zombieResources,
        utilizationData: analysis.utilizationData,
        serviceDetails,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: report,
        requestId: this.requestId,
      };
    } catch (error) {
      logger.error('MCP: Recommendations query failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: this.requestId,
      };
    }
  }

  /**
   * Generic MCP query handler
   * Routes queries to appropriate service based on resource type
   */
  async handleQuery(query: MCPResourceQuery): Promise<MCPResponse<unknown>> {
    logger.info('MCP: Handling query', { queryType: query.resourceType } as Record<string, unknown>);

    switch (query.resourceType) {
      case 'ec2': {
        const ec2Filters = query.filters as EC2Filters | undefined;
        const ec2Result = await this.queryEC2Instances(ec2Filters);
        return ec2Result as MCPResponse<unknown>;
      }
      case 'ebs': {
        const ebsFilters = query.filters as EBSFilters | undefined;
        const ebsResult = await this.queryEBSVolumes(ebsFilters);
        return ebsResult as MCPResponse<unknown>;
      }
      case 'cost': {
        const costResult = await this.queryCosts();
        return costResult as MCPResponse<unknown>;
      }
      case 'recommendations': {
        const recResult = await this.queryRecommendations(query.region);
        return recResult as MCPResponse<unknown>;
      }
      default:
        return {
          success: false,
          error: `Unknown resource type: ${query.resourceType}`,
          requestId: this.requestId,
        };
    }
  }
}

export const mcpService = new MCPService();