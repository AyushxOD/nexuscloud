# NexusCloud

A full-stack monorepo for cloud resource management, built with AWS CDK, Next.js 15, and AWS Lambda.

## Architecture Overview

```
nexuscloud/
├── infra/          # AWS CDK Infrastructure (TypeScript)
├── frontend/       # Next.js 15 Web Application
└── backend/        # AWS Lambda Functions (Node.js 20)
```

## Infrastructure (`/infra`)

Built with AWS CDK in TypeScript, deploying:

| Component | Description |
|-----------|-------------|
| **DynamoDB Table** | On-demand billing, stores cloud resource metadata with GSI for resource type queries |
| **Lambda Function** | Node.js 20 runtime, handles API requests with CRUD operations |
| **API Gateway** | HTTP API, triggers Lambda, includes CORS configuration |
| **IAM Roles** | Least-privilege execution role with scoped DynamoDB permissions |

### Stack Details

- **DynamoDB**: Single-table design with partition key (`pk`) and sort key (`sk`)
  - Pay-per-request billing
  - Point-in-time recovery enabled
  - GSI for resource type queries

- **Lambda**:
  - Runtime: Node.js 20.x
  - Memory: 256MB
  - Timeout: 30 seconds
  - Environment: `TABLE_NAME` for DynamoDB access

- **API Gateway**:
  - HTTP API (v2)
  - Routes: `/resources` and `/resources/{id}`
  - CORS enabled for all origins

### Deploy Infrastructure

```bash
cd infra
npm install
cdk deploy
```

## Backend (`/backend`)

Lambda function handling resource metadata CRUD:

- `GET /resources` - List all resources
- `GET /resources/{id}` - Get specific resource
- `POST /resources` - Create resource
- `PUT /resources/{id}` - Update resource
- `DELETE /resources/{id}` - Delete resource

### Build & Deploy

```bash
cd backend
npm install
npm run build
npm run package
# Deploy via AWS CLI or CDK
```

## Frontend (`/frontend`)

Next.js 15 application (structure ready for development):

```bash
cd frontend
npm install
npm run dev
```

## Prerequisites

- Node.js 20+
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)
- TypeScript

## Environment Variables

Create `.env` files as needed:

```env
# infra/.env
CDK_ACCOUNT_ID=123456789012
CDK_REGION=us-east-1
```

## Security

- IAM roles follow principle of least privilege
- Lambda has scoped access to only required DynamoDB table
- API Gateway includes CORS configuration
- Resources tagged for management

## License

MIT