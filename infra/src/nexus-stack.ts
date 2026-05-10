import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

export class NexusStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==========================================
    // DynamoDB Table (On-Demand)
    // Stores cloud resource metadata
    // ==========================================
    const resourceMetadataTable = new dynamodb.Table(
      this,
      'ResourceMetadataTable',
      {
        tableName: 'NexusCloud-ResourceMetadata',
        partitionKey: {
          name: 'pk',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'sk',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
      }
    );

    // Add GSIs for common query patterns
    resourceMetadataTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-ResourceType',
      partitionKey: {
        name: 'resourceType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // ==========================================
    // Lambda Function (Node.js 20)
    // API Handler for resource metadata operations
    // ==========================================
    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../backend/dist')
      ),
      functionName: 'NexusCloud-ApiHandler',
      description: 'NexusCloud API handler for resource metadata',
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: resourceMetadataTable.tableName,
        TABLE_REGION: this.region,
      },
    });

    // ==========================================
    // IAM Role - Least Privilege
    // Lambda execution role with minimal permissions
    // ==========================================
    const lambdaExecutionRole = new iam.Role(
      this,
      'LambdaExecutionRole',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'NexusCloud-LambdaExecutionRole',
        description: 'Least privilege execution role for NexusCloud Lambda',
      }
    );

    // Grant DynamoDB read/write access to specific table only
    resourceMetadataTable.grantReadWriteData(apiHandler);

    // Attach AWS managed policy for Lambda basic execution
    apiHandler.role?.attachInlinePolicy(
      new iam.Policy(this, 'LambdaBasicExecutionPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            resources: [
              `arn:${this.partition}:logs:${this.region}:${this.account}:log-group:/aws/lambda/${apiHandler.functionName}*`,
            ],
          }),
        ],
      })
    );

    // Add Cost Explorer and EC2 permissions for Cloud Optimizer
    apiHandler.role?.attachInlinePolicy(
      new iam.Policy(this, 'CloudOptimizerPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ce:GetCostAndUsage',
              'ce:GetCostForecast',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ec2:DescribeInstances',
              'ec2:DescribeVolumes',
              'ec2:DescribeVpcs',
              'ec2:DescribeRegions',
              'ec2:DescribeAddresses',
              'ec2:DescribeSnapshots',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              's3:ListAllMyBuckets',
              's3:ListBuckets',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'dynamodb:ListTables',
              'dynamodb:DescribeTable',
            ],
            resources: ['*'],
          }),
        ],
      })
    );

    // ==========================================
    // API Gateway (HTTP API)
    // Triggers Lambda for API operations
    // ==========================================
    const httpApi = new apigateway.HttpApi(this, 'NexusCloudApi', {
      apiName: 'NexusCloud-API',
      description: 'HTTP API for NexusCloud resource metadata operations',
      corsPreflight: {
        allowOrigins: ['http://localhost:3000', 'http://localhost:3001', '*'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: [
          'Content-Type',
          'Authorization',
        ],
        maxAge: cdk.Duration.seconds(86400),
      },
    });

    // Integrate HTTP API with Lambda
    const lambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      apiHandler
    );

    // Add routes
    httpApi.addRoutes({
      path: '/resources',
      methods: [
        apigateway.HttpMethod.GET,
        apigateway.HttpMethod.POST,
        apigateway.HttpMethod.OPTIONS,
      ],
      integration: lambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/resources/{id}',
      methods: [
        apigateway.HttpMethod.GET,
        apigateway.HttpMethod.PUT,
        apigateway.HttpMethod.DELETE,
        apigateway.HttpMethod.OPTIONS,
      ],
      integration: lambdaIntegration,
    });

    // Add optimizer route for Cloud Optimizer
    httpApi.addRoutes({
      path: '/optimizer',
      methods: [
        apigateway.HttpMethod.GET,
        apigateway.HttpMethod.POST,
        apigateway.HttpMethod.OPTIONS,
      ],
      integration: lambdaIntegration,
    });

    // Add catch-all proxy route for any unmatched paths
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [
        apigateway.HttpMethod.GET,
        apigateway.HttpMethod.POST,
        apigateway.HttpMethod.PUT,
        apigateway.HttpMethod.DELETE,
        apigateway.HttpMethod.OPTIONS,
      ],
      integration: lambdaIntegration,
    });

    // ==========================================
    // Outputs
    // ==========================================
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.url!,
      description: 'NexusCloud API Gateway endpoint URL',
      exportName: 'NexusCloud-ApiEndpoint',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: resourceMetadataTable.tableName,
      description: 'DynamoDB table name for resource metadata',
      exportName: 'NexusCloud-TableName',
    });

    new cdk.CfnOutput(this, 'FunctionName', {
      value: apiHandler.functionName,
      description: 'Lambda function name',
      exportName: 'NexusCloud-FunctionName',
    });

    // Add description tag to all resources
    cdk.Tags.of(this).add('Project', 'NexusCloud');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Environment', 'Production');
  }
}