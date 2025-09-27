import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export interface SiteConfig {
  siteName: string;
  sourcePath: string;
  indexDocument?: string;
  errorDocument?: string;
  bucketName?: string;
}

export interface StaticSitesStackProps extends cdk.StackProps {
  sites: SiteConfig[];
  defaultIndexDocument?: string;
  defaultErrorDocument?: string;
  publicReadAccess?: boolean;
  removalPolicy?: 'DESTROY' | 'RETAIN';
}

export class StaticSitesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StaticSitesStackProps) {
    super(scope, id, props);

    const {
      sites,
      defaultIndexDocument = 'index.html',
      defaultErrorDocument = '404.html',
      publicReadAccess = true,
      removalPolicy = 'RETAIN'
    } = props;

    for (const site of sites) {
      const indexDocument = site.indexDocument ?? defaultIndexDocument;
      const errorDocument = site.errorDocument ?? defaultErrorDocument;

      const bucket = new s3.Bucket(this, `${site.siteName}Bucket`, {
        bucketName: site.bucketName,
        websiteIndexDocument: indexDocument,
        websiteErrorDocument: errorDocument,
        blockPublicAccess: publicReadAccess ? s3.BlockPublicAccess.BLOCK_ACLS : s3.BlockPublicAccess.BLOCK_ALL,
        publicReadAccess,
        accessControl: publicReadAccess ? s3.BucketAccessControl.PUBLIC_READ : undefined,
        enforceSSL: !publicReadAccess,
        removalPolicy: removalPolicy === 'DESTROY' ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
        autoDeleteObjects: removalPolicy === 'DESTROY'
      });

      if (publicReadAccess) {
        bucket.addToResourcePolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['s3:GetObject'],
          resources: [bucket.arnForObjects('*')]
        }));
      }

      new s3deploy.BucketDeployment(this, `${site.siteName}Deploy`, {
        sources: [s3deploy.Source.asset(path.resolve(site.sourcePath))],
        destinationBucket: bucket,
        cacheControl: [s3deploy.CacheControl.fromString('public, max-age=31536000, immutable')],
        prune: true
      });

      new cdk.CfnOutput(this, `${site.siteName}WebsiteURL`, {
        value: bucket.bucketWebsiteUrl,
        description: `S3 website URL for ${site.siteName}`
      });

      new cdk.CfnOutput(this, `${site.siteName}BucketName`, {
        value: bucket.bucketName,
        description: `Bucket name for ${site.siteName}`
      });

      new cdk.CfnOutput(this, `${site.siteName}WebsiteDomain`, {
        value: bucket.bucketWebsiteDomainName,
        description: `S3 website domain for ${site.siteName}`
      });
    }
  }
}
