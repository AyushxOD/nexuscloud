import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeAddressesCommand,
  DescribeSnapshotsCommand,
  DescribeInstancesCommandInput,
  DescribeVolumesCommandInput,
} from '@aws-sdk/client-ec2';
import { logger } from '../utils/logger.js';
import { AWSServiceError } from '../utils/errors.js';
import type { EC2Instance, EBSVolume, ZombieResource } from '../types/index.js';

export class EC2Service {
  private client: EC2Client;
  private defaultRegion: string;

  constructor() {
    this.defaultRegion = process.env.AWS_REGION || 'us-east-1';
    this.client = new EC2Client({
      region: this.defaultRegion,
      maxAttempts: 3,
    });
  }

  private getRegion(region?: string): string {
    return region || this.defaultRegion;
  }

  private getClientForRegion(region: string): EC2Client {
    if (region === this.defaultRegion) {
      return this.client;
    }
    return new EC2Client({ region, maxAttempts: 3 });
  }

  async getActiveInstances(region?: string): Promise<EC2Instance[]> {
    const targetRegion = this.getRegion(region);
    const client = this.getClientForRegion(targetRegion);

    const params: DescribeInstancesCommandInput = {
      Filters: [
        {
          Name: 'instance-state-name',
          Values: ['running', 'stopped', 'pending', 'stopping'],
        },
      ],
    };

    try {
      logger.info('Fetching EC2 instances', { region: targetRegion } as Record<string, unknown>);

      const instances: EC2Instance[] = [];
      let nextToken: string | undefined;

      do {
        if (nextToken) {
          params.NextToken = nextToken;
        }

        const command = new DescribeInstancesCommand(params);
        const response = await client.send(command);

        for (const reservation of response.Reservations || []) {
          for (const instance of reservation.Instances || []) {
            const tags: Record<string, string> = {};
            if (instance.Tags) {
              for (const tag of instance.Tags) {
                if (tag.Key && tag.Value) {
                  tags[tag.Key] = tag.Value;
                }
              }
            }

            instances.push({
              instanceId: instance.InstanceId || 'unknown',
              instanceType: instance.InstanceType || 'unknown',
              state: instance.State?.Name || 'unknown',
              name: tags.Name || instance.InstanceId || 'unnamed',
              tags,
              launchTime: instance.LaunchTime?.toISOString() || new Date().toISOString(),
              region: targetRegion,
            });
          }
        }

        nextToken = response.NextToken;
      } while (nextToken);

      logger.info('EC2 instances fetched', { count: instances.length, region: targetRegion } as Record<string, unknown>);
      return instances;
    } catch (error) {
      throw new AWSServiceError(
        'Failed to fetch EC2 instances',
        'EC2',
        'DescribeInstances',
        error,
        true
      );
    }
  }

  async getStoppedInstances(region?: string): Promise<EC2Instance[]> {
    const targetRegion = this.getRegion(region);
    const client = this.getClientForRegion(targetRegion);

    const params: DescribeInstancesCommandInput = {
      Filters: [
        {
          Name: 'instance-state-name',
          Values: ['stopped'],
        },
      ],
    };

    try {
      logger.info('Fetching stopped EC2 instances', { region: targetRegion } as Record<string, unknown>);

      const instances: EC2Instance[] = [];
      let nextToken: string | undefined;

      do {
        if (nextToken) {
          params.NextToken = nextToken;
        }

        const command = new DescribeInstancesCommand(params);
        const response = await client.send(command);

        for (const reservation of response.Reservations || []) {
          for (const instance of reservation.Instances || []) {
            const tags: Record<string, string> = {};
            if (instance.Tags) {
              for (const tag of instance.Tags) {
                if (tag.Key && tag.Value) {
                  tags[tag.Key] = tag.Value;
                }
              }
            }

            instances.push({
              instanceId: instance.InstanceId || 'unknown',
              instanceType: instance.InstanceType || 'unknown',
              state: instance.State?.Name || 'unknown',
              name: tags.Name || instance.InstanceId || 'unnamed',
              tags,
              launchTime: instance.LaunchTime?.toISOString() || new Date().toISOString(),
              region: targetRegion,
            });
          }
        }

        nextToken = response.NextToken;
      } while (nextToken);

      logger.info('Stopped instances fetched', { count: instances.length } as Record<string, unknown>);
      return instances;
    } catch (error) {
      throw new AWSServiceError(
        'Failed to fetch stopped EC2 instances',
        'EC2',
        'DescribeInstances',
        error,
        true
      );
    }
  }

  async getVolumes(region?: string): Promise<EBSVolume[]> {
    const targetRegion = this.getRegion(region);
    const client = this.getClientForRegion(targetRegion);

    const params: DescribeVolumesCommandInput = {};

    try {
      logger.info('Fetching EBS volumes', { region: targetRegion } as Record<string, unknown>);

      const volumes: EBSVolume[] = [];
      let nextToken: string | undefined;

      do {
        if (nextToken) {
          params.NextToken = nextToken;
        }

        const command = new DescribeVolumesCommand(params);
        const response = await client.send(command);

        for (const volume of response.Volumes || []) {
          const attachments: EBSVolume['attachments'] = volume.Attachments?.map((att: any) => ({
            instanceId: att.InstanceId || null,
            device: att.Device || null,
            attachTime: att.AttachTime?.toISOString() || null,
            deleteOnTermination: att.DeleteOnTermination || null,
          })) || [];

          const tags: Record<string, string> = {};
          if (volume.Tags) {
            for (const tag of volume.Tags) {
              if (tag.Key && tag.Value) {
                tags[tag.Key] = tag.Value;
              }
            }
          }

          volumes.push({
            volumeId: volume.VolumeId || 'unknown',
            volumeType: volume.VolumeType || null,
            size: volume.Size || null,
            state: volume.State || null,
            attachments,
            tags,
            region: targetRegion,
          });
        }

        nextToken = response.NextToken;
      } while (nextToken);

      logger.info('EBS volumes fetched', { count: volumes.length } as Record<string, unknown>);
      return volumes;
    } catch (error) {
      throw new AWSServiceError(
        'Failed to fetch EBS volumes',
        'EC2',
        'DescribeVolumes',
        error,
        true
      );
    }
  }

  async getUnattachedVolumes(region?: string): Promise<EBSVolume[]> {
    const allVolumes = await this.getVolumes(region);
    return allVolumes.filter((volume) => volume.state === 'available');
  }

  getInstanceHourlyCost(instanceType: string): number {
    const instanceCosts: Record<string, number> = {
      't2.micro': 0.023,
      't2.small': 0.046,
      't2.medium': 0.092,
      't2.large': 0.184,
      't3.micro': 0.0208,
      't3.small': 0.0416,
      't3.medium': 0.0832,
      't3.large': 0.1664,
      't3a.micro': 0.0189,
      't3a.small': 0.0378,
      't3a.medium': 0.0756,
      't3a.large': 0.1512,
      'm5.large': 0.192,
      'm5.xlarge': 0.384,
      'c5.large': 0.17,
      'c5.xlarge': 0.34,
    };

    return instanceCosts[instanceType.toLowerCase()] || 0.10;
  }

  getVolumeMonthlyCost(size: number, volumeType: string): number {
    const costPerGB: Record<string, number> = {
      'gp2': 0.10,
      'gp3': 0.08,
      'io1': 0.125,
      'io2': 0.125,
      'st1': 0.045,
      'sc1': 0.025,
      'standard': 0.10,
    };

    const monthlyRate = costPerGB[volumeType.toLowerCase()] || 0.10;
    return size * monthlyRate;
  }

  async getUnattachedEIPs(region?: string): Promise<ZombieResource[]> {
    const targetRegion = this.getRegion(region);
    const client = this.getClientForRegion(targetRegion);

    try {
      logger.info('Fetching unattached Elastic IPs', { region: targetRegion } as Record<string, unknown>);

      const command = new DescribeAddressesCommand({
        Filters: [{ Name: 'association', Values: ['false'] }],
      });
      const response = await client.send(command);

      console.log('EC2: DescribeAddresses response:', JSON.stringify(response.Addresses || []).substring(0, 500));

      const zombies: ZombieResource[] = [];

      for (const addr of response.Addresses || []) {
        if (!addr.AllocationId) continue;

        // EIPs cost ~$0.005/hour when not attached
        const monthlyCost = 0.005 * 24 * 30;

        zombies.push({
          resourceId: addr.AllocationId,
          resourceType: 'eip',
          description: `Unattached Elastic IP (${addr.PublicIp || 'no public IP'}) - $${monthlyCost.toFixed(2)}/month waste`,
          estimatedSavings: Math.round(monthlyCost * 100) / 100,
          region: targetRegion,
          createdAt: addr.AllocationId ? new Date().toISOString() : new Date().toISOString(),
        });
      }

      logger.info('Unattached EIPs fetched', { count: zombies.length } as Record<string, unknown>);
      return zombies;
    } catch (error) {
      logger.error('Failed to fetch EIPs', error);
      return [];
    }
  }

  async getOrphanedSnapshots(region?: string): Promise<ZombieResource[]> {
    const targetRegion = this.getRegion(region);
    const client = this.getClientForRegion(targetRegion);

    try {
      logger.info('Fetching orphaned snapshots', { region: targetRegion } as Record<string, unknown>);

      const command = new DescribeSnapshotsCommand({
        Filters: [{ Name: 'owner', Values: ['self'] }],
      });
      const response = await client.send(command);

      const zombies: ZombieResource[] = [];
      const activeVolumeIds = new Set((await this.getVolumes(targetRegion)).map(v => v.volumeId));

      for (const snapshot of response.Snapshots || []) {
        if (!snapshot.SnapshotId) continue;

        // Check if snapshot is attached to any volume
        const isOrphaned = !snapshot.VolumeId || !activeVolumeIds.has(snapshot.VolumeId);

        if (isOrphaned) {
          // Snapshots cost ~$0.05/GB/month
          const size = snapshot.VolumeSize || 0;
          const monthlyCost = size * 0.05;

          zombies.push({
            resourceId: snapshot.SnapshotId,
            resourceType: 'snapshot',
            description: `Orphaned snapshot (${size} GB) - No linked volume`,
            estimatedSavings: Math.round(monthlyCost * 100) / 100,
            region: targetRegion,
            createdAt: snapshot.StartTime?.toISOString() || new Date().toISOString(),
          });
        }
      }

      logger.info('Orphaned snapshots fetched', { count: zombies.length } as Record<string, unknown>);
      return zombies;
    } catch (error) {
      logger.error('Failed to fetch snapshots', error);
      return [];
    }
  }
}

export const ec2Service = new EC2Service();