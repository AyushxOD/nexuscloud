/**
 * Cloud Optimizer Handler
 *
 * Main entry point for the Cloud Optimizer Lambda function.
 * Provides cost analysis, resource scanning, and optimization recommendations.
 */

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { costExplorerService } from './services/cost-explorer.js';
import { ec2Service } from './services/ec2.js';
import { mcpService } from './services/mcp-service.js';
import { recommendationEngine } from './recommendations/recommendation-engine.js';
import { logger, createLogger } from './utils/logger.js';
import { handleError } from './utils/errors.js';
import type {
  OptimizationReport,
  CloudOptimizerResponse,
  HandlerEvent,
} from './types/index.js';

// Helper to extract path from event
function getPath(event: APIGatewayProxyEvent): string {
  if ('requestContext' in event && event.requestContext && typeof event.requestContext === 'object' && 'http' in event.requestContext) {
    const httpContext = event.requestContext as { http?: { path?: string } };
    return httpContext.http?.path || '/';
  }
  return (event as unknown as { rawPath?: string }).rawPath || event.path || '/';
}

// Helper to extract HTTP method from event
function getMethod(event: APIGatewayProxyEvent): string {
  if ('requestContext' in event && event.requestContext && typeof event.requestContext === 'object' && 'http' in event.requestContext) {
    const httpContext = event.requestContext as { http?: { method?: string } };
    return httpContext.http?.method || 'GET';
  }
  return event.httpMethod || 'GET';
}

// Helper to get headers from event
function getHeaders(event: APIGatewayProxyEvent): Record<string, string | undefined> {
  return event.headers || {};
}

/**
 * Execute full cloud optimization analysis
 */
async function runOptimizationAnalysis(region?: string): Promise<OptimizationReport> {
  logger.info('Starting cloud optimization analysis', { region } as Record<string, unknown>);

  const costData = await costExplorerService.getCurrentMonthSpend();
  const analysis = await recommendationEngine.analyzeAllResources(region);
  const activeInstances = await ec2Service.getActiveInstances(region);
  const allVolumes = await ec2Service.getVolumes(region);

  const summary = recommendationEngine.generateSummary(analysis);

  const topServices = await costExplorerService.getTopServices(10);

  const report: OptimizationReport = {
    summary: {
      totalRecommendations: summary.totalRecommendations,
      estimatedMonthlySavings: summary.estimatedMonthlySavings,
      scannedResources: {
        ec2Instances: activeInstances.length,
        ebsVolumes: allVolumes.length,
      },
    },
    currentSpend: costData,
    recommendations: [...analysis.stoppedInstances, ...analysis.unattachedVolumes],
    ec2Instances: activeInstances,
    topServices,
    zombieResources: analysis.zombieResources,
    utilizationData: analysis.utilizationData,
    timestamp: new Date().toISOString(),
  };

  logger.info('Optimization analysis complete', {
    recommendations: report.summary.totalRecommendations,
    savings: report.summary.estimatedMonthlySavings,
  } as Record<string, unknown>);

  return report;
}

/**
 * Handle spending query action
 */
async function handleGetSpending(): Promise<CloudOptimizerResponse> {
  try {
    logger.info('Handling get-spending action', {} as Record<string, unknown>);

    const costData = await costExplorerService.getCurrentMonthSpend();

    return {
      success: true,
      data: {
        summary: {
          totalRecommendations: 0,
          estimatedMonthlySavings: 0,
          scannedResources: { ec2Instances: 0, ebsVolumes: 0 },
        },
        currentSpend: costData,
        recommendations: [],
        ec2Instances: [],
        topServices: [],
        zombieResources: [],
        utilizationData: [],
        timestamp: new Date().toISOString(),
      },
      requestId: logger.getRequestId(),
    };
  } catch (error) {
    const cloudError = handleError(error, { action: 'get-spending' });
    return {
      success: false,
      error: cloudError.message,
      requestId: logger.getRequestId(),
    };
  }
}

/**
 * Handle recommendations query action
 */
async function handleGetRecommendations(region?: string): Promise<CloudOptimizerResponse> {
  try {
    logger.info('Handling get-recommendations action', { region } as Record<string, unknown>);

    const report = await runOptimizationAnalysis(region);

    return {
      success: true,
      data: report,
      requestId: logger.getRequestId(),
    };
  } catch (error) {
    const cloudError = handleError(error, { action: 'get-recommendations', region });
    return {
      success: false,
      error: cloudError.message,
      requestId: logger.getRequestId(),
    };
  }
}

/**
 * Handle analyze action (full analysis)
 */
async function handleAnalyze(region?: string): Promise<CloudOptimizerResponse> {
  try {
    logger.info('Handling analyze action', { region } as Record<string, unknown>);

    const report = await runOptimizationAnalysis(region);

    return {
      success: true,
      data: report,
      requestId: logger.getRequestId(),
    };
  } catch (error) {
    const cloudError = handleError(error, { action: 'analyze', region });
    return {
      success: false,
      error: cloudError.message,
      requestId: logger.getRequestId(),
    };
  }
}

/**
 * Handle MCP-style inspection queries
 */
async function handleMCPInspect(
  resourceType: string,
  filters?: Record<string, unknown>,
  region?: string
): Promise<CloudOptimizerResponse> {
  try {
    logger.info('Handling MCP inspect', { resourceType, filters, region } as Record<string, unknown>);

    const query = {
      resourceType: resourceType as 'ec2' | 'ebs' | 'cost' | 'recommendations',
      filters,
      region,
    };

    const result = await mcpService.handleQuery(query);

    return {
      success: result.success,
      data: result.data as OptimizationReport | undefined,
      error: result.error,
      requestId: result.requestId,
    };
  } catch (error) {
    const cloudError = handleError(error, { action: 'mcp-inspect', resourceType });
    return {
      success: false,
      error: cloudError.message,
      requestId: logger.getRequestId(),
    };
  }
}

/**
 * Parse and validate request body
 */
function parseRequest(event: APIGatewayProxyEvent): HandlerEvent | null {
  try {
    const httpMethod = getMethod(event);
    const path = getPath(event);

    if (event.body) {
      const parsed = JSON.parse(event.body);
      return {
        action: parsed.action || 'analyze',
        region: parsed.region,
        includeDetails: parsed.includeDetails,
      };
    }

    // Check query parameters
    if (event.queryStringParameters) {
      return {
        action: (event.queryStringParameters.action as HandlerEvent['action']) || 'analyze',
        region: event.queryStringParameters.region,
        includeDetails: event.queryStringParameters.includeDetails === 'true',
      };
    }

    // Default action
    return { action: 'analyze' };
  } catch {
    return null;
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const path = getPath(event);
  const httpMethod = getMethod(event);

  createLogger();
  logger.info('Cloud Optimizer request received', {
    httpMethod,
    path,
    requestId: logger.getRequestId(),
  } as Record<string, unknown>);

  try {
    const request = parseRequest(event);

    if (!request) {
      logger.warn('Invalid request format');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid request format',
          requestId: logger.getRequestId(),
        }),
      };
    }

    logger.info('Processing request', { action: request.action, region: request.region } as Record<string, unknown>);

    let response: CloudOptimizerResponse;

    const headers = getHeaders(event);
    const mcpInspect = headers['x-mcp-inspect'] || headers['X-MCP-Inspect'];
    if (mcpInspect) {
      response = await handleMCPInspect(
        mcpInspect as string,
        { state: request.action === 'get-recommendations' ? undefined : undefined },
        request.region
      );
    } else {
      switch (request.action) {
        case 'get-spending':
          response = await handleGetSpending();
          break;
        case 'get-recommendations':
          response = await handleGetRecommendations(request.region);
          break;
        case 'analyze':
        default:
          response = await handleAnalyze(request.region);
          break;
      }
    }

    const statusCode = response.success ? 200 : 500;

    logger.info('Request completed', {
      success: response.success,
      statusCode,
    } as Record<string, unknown>);

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    const cloudError = handleError(error, { path, method: httpMethod });

    logger.error('Unhandled error in handler', error);

    return {
      statusCode: cloudError.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: cloudError.message,
        requestId: logger.getRequestId(),
      }),
    };
  }
};

export {
  runOptimizationAnalysis,
  handleAnalyze,
  handleGetSpending,
  handleGetRecommendations,
  handleMCPInspect,
};