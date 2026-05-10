import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NexusStack } from './nexus-stack';

const app = new cdk.App();

new NexusStack(app, 'NexusCloudStack', {
  env: {
    account: process.env.CDK_ACCOUNT_ID || '686827376386',
    region: process.env.CDK_REGION || 'us-east-1',
  },
  description: 'NexusCloud - Core infrastructure stack',
});

app.synth();