/**
 * Resource Scanner - Fetches detailed resources per service for Deep Dive
 */

import {
  S3Client,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
} from '@aws-sdk/client-ec2';
import {
  DynamoDBClient,
  ListTablesCommand,
} from '@aws-sdk/client-dynamodb';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import { logger } from '../utils/logger.js';

export interface ResourceDetail {
  name: string;
  createdAt?: string;
  region?: string;
  details?: Record<string, unknown>;
}

export interface ServiceResources {
  serviceName: string;
  resources: ResourceDetail[];
  cost: number;
}

export class ResourceScannerService {
  private defaultRegion = process.env.AWS_REGION || 'us-east-1';

  async getServiceResources(serviceName: string, limit: number = 10): Promise<ServiceResources> {
    const lowerName = serviceName.toLowerCase();

    logger.info('Getting resources for service', { serviceName } as Record<string, unknown>);

    try {
      if (lowerName.includes('s3') || lowerName.includes('simple storage')) {
        return await this.getS3Resources();
      }
      if (lowerName.includes('dynamodb')) {
        return await this.getDynamoDBResources();
      }
      if (lowerName.includes('rds') || lowerName.includes('database')) {
        return await this.getRDSResources();
      }
      if (lowerName.includes('ec2') || lowerName.includes('compute')) {
        return await this.getEC2Resources();
      }
      if (lowerName.includes('ecr')) {
        return await this.getECRResources();
      }

      return { serviceName, resources: [], cost: 0 };
    } catch (error) {
      logger.error('Failed to get service resources', { serviceName, error } as Record<string, unknown>);
      return { serviceName, resources: [], cost: 0 };
    }
  }

  private async getS3Resources(): Promise<ServiceResources> {
    const client = new S3Client({ region: this.defaultRegion });

    try {
      const command = new ListBucketsCommand({});
      const response = await client.send(command);

      const resources: ResourceDetail[] = (response.Buckets || []).slice(0, 10).map(bucket => ({
        name: bucket.Name || 'unknown',
        createdAt: bucket.CreationDate?.toISOString(),
      }));

      console.log('S3: Found buckets:', resources.length);

      return {
        serviceName: 'Amazon S3',
        resources,
        cost: 0,
      };
    } catch (error) {
      console.log('S3: ERROR:', error);
      return { serviceName: 'Amazon S3', resources: [], cost: 0 };
    }
  }

  private async getDynamoDBResources(): Promise<ServiceResources> {
    const client = new DynamoDBClient({ region: this.defaultRegion });

    try {
      const command = new ListTablesCommand({ Limit: 10 });
      const response = await client.send(command);

      const resources: ResourceDetail[] = (response.TableNames || []).map(tableName => ({
        name: tableName,
      }));

      console.log('DynamoDB: Found tables:', resources.length);

      return {
        serviceName: 'Amazon DynamoDB',
        resources,
        cost: 0,
      };
    } catch (error) {
      console.log('DynamoDB: ERROR:', error);
      return { serviceName: 'Amazon DynamoDB', resources: [], cost: 0 };
    }
  }

  private async getRDSResources(): Promise<ServiceResources> {
    const client = new RDSClient({ region: this.defaultRegion });

    try {
      const command = new DescribeDBInstancesCommand({});
      const response = await client.send(command);

      const resources: ResourceDetail[] = (response.DBInstances || []).slice(0, 10).map(instance => ({
        name: instance.DBInstanceIdentifier || 'unknown',
        createdAt: instance.InstanceCreateTime?.toISOString(),
        details: {
          engine: instance.Engine,
          instanceClass: instance.DBInstanceClass,
          status: instance.DBInstanceStatus,
        },
      }));

      console.log('RDS: Found instances:', resources.length);

      return {
        serviceName: 'Amazon RDS',
        resources,
        cost: 0,
      };
    } catch (error) {
      console.log('RDS: ERROR:', error);
      return { serviceName: 'Amazon RDS', resources: [], cost: 0 };
    }
  }

  private async getEC2Resources(): Promise<ServiceResources> {
    const client = new EC2Client({ region: this.defaultRegion });

    try {
      // Get VPCs as a proxy for network resources
      const vpcCommand = new DescribeVpcsCommand({});
      const vpcResponse = await client.send(vpcCommand);

      const resources: ResourceDetail[] = (vpcResponse.Vpcs || []).slice(0, 10).map(vpc => ({
        name: vpc.VpcId || 'unknown',
        createdAt: vpc.CidrBlock ? `CIDR: ${vpc.CidrBlock}` : undefined,
        details: {
          state: vpc.State,
          isDefault: vpc.IsDefault,
        },
      }));

      console.log('EC2: Found VPCs:', resources.length);

      return {
        serviceName: 'Amazon EC2',
        resources,
        cost: 0,
      };
    } catch (error) {
      console.log('EC2: ERROR:', error);
      return { serviceName: 'Amazon EC2', resources: [], cost: 0 };
    }
  }

  private async getECRResources(): Promise<ServiceResources> {
    // ECR doesn't have a simple List API in SDK v3 without additional setup
    // Return placeholder for now
    console.log('ECR: Resources require additional permissions');

    return {
      serviceName: 'Amazon ECR',
      resources: [],
      cost: 0,
    };
  }
}

export const resourceScannerService = new ResourceScannerService();