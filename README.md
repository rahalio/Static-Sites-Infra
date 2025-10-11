# Static Sites Infrastructure

A generic AWS CDK infrastructure for deploying static websites with CloudFront, S3, ACM certificates, and Route53.

## Features

- 🚀 **CloudFront Distribution** with HTTPS
- 🔒 **ACM Certificate** with automatic DNS validation
- 📦 **Private S3 Bucket** with OAI for secure access
- 🌐 **Route53** A/AAAA records for apex and www domains
- ⚙️ **Configurable** via environment variables
- 🔄 **Reusable** for multiple static site deployments

## Prerequisites

- Node.js and npm
- AWS CLI configured with credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- A Route53 hosted zone for your domain

## Configuration

### 1. AWS Environment Variables

Create a `.env.aws` file in the project root:

```bash
AWS_REGION=us-east-1
AWS_PROFILE=default
AWS_ACCOUNT_ID=your_aws_account_id
```

### 2. Domain Configuration

Update `lib/domain-config.ts` with your domain:

```typescript
export const DOMAIN_NAME = "yourdomain.com";
```

### 3. Stack Configuration

Set the stack name (optional):

```bash
export CDK_STACK_NAME=YourSiteStack
```

If not set, defaults to `StaticSiteStack`.

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Bootstrap CDK (first time only)

```bash
npx cdk bootstrap
```

### 3. Deploy Stack

```bash
npx cdk deploy --all
```

### 4. Generate Environment File

After deployment, generate the `.env` file with resource outputs:

```bash
export STACK=YourSiteStack
./scripts/gen-env.sh
```

This creates a `.env` file with:
- S3 bucket name
- CloudFront distribution ID
- AWS region

## Project Structure

```
├── bin/
│   └── app.ts                    # CDK app entry point
├── lib/
│   ├── domain-config.ts          # Domain configuration
│   └── static-site-cloudfront.ts # Stack definition
├── scripts/
│   └── gen-env.sh                # Generate .env from stack outputs
├── .env.aws                      # AWS credentials (gitignored)
├── .env                          # Generated resource outputs (gitignored)
└── cdk.json                      # CDK configuration
```

## Stack Options

Customize the stack in `bin/app.ts`:

```typescript
new StaticSiteWithCFAcmStack(app, stackName, {
  env: { account, region },
  domainName: DOMAIN_NAME,
  includeWww: true,                    // Include www subdomain
  priceClass: "PriceClass_100",        // CloudFront price class
  removalPolicy: "RETAIN",             // RETAIN or DESTROY
});
```

### Price Classes

- `PriceClass_100` - US, Canada, Europe
- `PriceClass_200` - US, Canada, Europe, Asia, Middle East, Africa
- `PriceClass_All` - All edge locations

## Deploying Multiple Sites

1. Create a new branch for each site
2. Update `lib/domain-config.ts` with the new domain
3. Set `CDK_STACK_NAME` to a unique name
4. Deploy the stack

```bash
export CDK_STACK_NAME=SecondSiteStack
npx cdk deploy --all
```

## Updating Site Content

After deployment, upload your static site files to the S3 bucket:

```bash
aws s3 sync ./dist s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

Use the bucket name and distribution ID from your `.env` file.

## Cleanup

To destroy the stack and all resources:

```bash
npx cdk destroy
```

⚠️ **Warning**: If `removalPolicy` is set to `RETAIN`, the S3 bucket will not be deleted.

## Security

- `.env.aws` is gitignored to protect credentials
- S3 bucket has no public access (CloudFront access only via OAI)
- Enforces SSL/TLS for S3 access
- HTTPS-only via CloudFront

## Troubleshooting

### "Need to perform AWS calls but no credentials configured"

Make sure your AWS credentials are configured:

```bash
aws configure --profile default
```

### "Cannot retrieve value from context provider hosted-zone"

Ensure `AWS_ACCOUNT_ID` and `AWS_REGION` are set in `.env.aws` and the file is loaded.

### Route53 hosted zone not found

Verify your domain has a hosted zone in Route53 and you have the correct permissions.

## License

MIT
