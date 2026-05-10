/**
 * NexusCloud Backend - Lambda Entry Point
 *
 * Main handler that routes requests to Cloud Optimizer or resource metadata API
 * based on the request path.
 */

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { handler as cloudOptimizerHandler } from './src/cloud-optimizer.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME || 'NexusCloud-ResourceMetadata';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

// Helper to extract path from event (handles both REST and HTTP API formats)
function getPath(event: APIGatewayProxyEvent): string {
  // HTTP API v2 format
  if ('requestContext' in event && event.requestContext && typeof event.requestContext === 'object' && 'http' in event.requestContext) {
    const httpContext = event.requestContext as { http?: { path?: string } };
    return httpContext.http?.path || '/';
  }
  // REST API format or direct invocation
  return (event as unknown as { rawPath?: string }).rawPath || event.path || '/';
}

// Helper to extract HTTP method from event
function getMethod(event: APIGatewayProxyEvent): string {
  // HTTP API v2 format
  if ('requestContext' in event && event.requestContext && typeof event.requestContext === 'object' && 'http' in event.requestContext) {
    const httpContext = event.requestContext as { http?: { method?: string } };
    return httpContext.http?.method || 'GET';
  }
  // REST API format or direct invocation
  return event.httpMethod || 'GET';
}

/**
 * Generate unique ID for resources
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Parse JSON body safely
 */
const parseBody = (body: string | null): Record<string, unknown> | null => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

/**
 * Resource Metadata CRUD Handler
 */
async function handleResourceMetadata(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const path = getPath(event);
  const httpMethod = getMethod(event);
  const pathParameters = event.pathParameters || {};
  const resourceId = pathParameters?.id;

  try {
    // GET /resources - List all resources
    if (httpMethod === 'GET' && path === '/resources') {
      const result = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: 'GSI1-ResourceType',
          KeyConditionExpression: 'resourceType = :rt',
          ExpressionAttributeValues: {
            ':rt': 'RESOURCE',
          },
        })
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          items: result.Items || [],
          count: result.Count || 0,
        }),
      };
    }

    // GET /resources/{id} - Get specific resource
    if (httpMethod === 'GET' && resourceId) {
      const result = await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            pk: `RESOURCE#${resourceId}`,
            sk: `METADATA#${resourceId}`,
          },
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Resource not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Item),
      };
    }

    // POST /resources - Create resource
    if (httpMethod === 'POST' && path === '/resources') {
      const data = parseBody(event.body);
      if (!data || !data.name) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Name is required' }),
        };
      }

      const id = generateId();
      const timestamp = new Date().toISOString();

      const resource = {
        pk: `RESOURCE#${id}`,
        sk: `METADATA#${id}`,
        resourceType: 'RESOURCE',
        name: data.name,
        metadata: data.metadata,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: resource,
        })
      );

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(resource),
      };
    }

    // PUT /resources/{id} - Update resource
    if (httpMethod === 'PUT' && resourceId) {
      const data = parseBody(event.body);
      const timestamp = new Date().toISOString();

      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            pk: `RESOURCE#${resourceId}`,
            sk: `METADATA#${resourceId}`,
            resourceType: 'RESOURCE',
            name: data?.name || 'Unknown',
            metadata: data?.metadata,
            updatedAt: timestamp,
          },
        })
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Resource updated', id: resourceId }),
      };
    }

    // DELETE /resources/{id} - Delete resource
    if (httpMethod === 'DELETE' && resourceId) {
      await docClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: {
            pk: `RESOURCE#${resourceId}`,
            sk: `METADATA#${resourceId}`,
          },
        })
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Resource deleted', id: resourceId }),
      };
    }

    // Default - check if it's the root path - return catchall
    if (path === '/' || path === '') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'alive',
          message: 'Global Proxy Active',
          service: 'NexusCloud API',
        }),
      };
    }

    // Default - Method not allowed
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Main Lambda Handler
 * Routes requests based on path:
 * - /optimizer/* -> Cloud Optimizer
 * - /resources/* -> Resource Metadata CRUD
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const path = getPath(event);
  const httpMethod = getMethod(event);

  console.log('Request received:', { path, method: httpMethod });

  // Handle OPTIONS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Route to appropriate handler based on path prefix
  if (path.startsWith('/optimizer')) {
    return cloudOptimizerHandler(event);
  }

  // Default to resource metadata handler
  return handleResourceMetadata(event);
};