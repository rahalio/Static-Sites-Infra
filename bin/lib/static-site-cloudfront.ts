import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

export interface StaticSiteWithCFAcmStackProps extends cdk.StackProps {
  domainName: string;
  includeWww?: boolean;
  priceClass?: 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All';
  removalPolicy?: 'DESTROY' | 'RETAIN';
}

export class StaticSiteWithCFAcmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StaticSiteWithCFAcmStackProps) {
    super(scope, id, props);

    const {
      domainName,
      includeWww = true,
      priceClass = 'PriceClass_100',
      removalPolicy = 'RETAIN'
    } = props;

    // Lookup the Route 53 Hosted Zone for the apex domain
    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', { domainName });

    // Private S3 bucket to hold static site content (no public access)
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: false,
      removalPolicy: removalPolicy === 'DESTROY' ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: removalPolicy === 'DESTROY'
    });

    // ACM certificate for CloudFront must be in us-east-1
    const altNames = includeWww ? [`www.${domainName}`] : [];
    const certificate = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName,
      subjectAlternativeNames: altNames,
      hostedZone: zone,
      region: 'us-east-1'
    });

    // Origin Access Identity so CloudFront can read from the private bucket
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    siteBucket.grantRead(oai);

    // Map string to enum for price class
    const pcMap = {
      'PriceClass_100': cloudfront.PriceClass.PRICE_CLASS_100,
      'PriceClass_200': cloudfront.PriceClass.PRICE_CLASS_200,
      'PriceClass_All': cloudfront.PriceClass.PRICE_CLASS_ALL,
    } as const;

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, { originAccessIdentity: oai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      certificate,
      domainNames: includeWww ? [domainName, `www.${domainName}`] : [domainName],
      priceClass: pcMap[priceClass],
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.minutes(1) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.minutes(1) }
      ]
    });

    // Route 53 alias records to CloudFront
    new route53.ARecord(this, 'AliasApex', {
      zone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    });
    new route53.AaaaRecord(this, 'AliasApexAAAA', {
      zone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    });

    if (includeWww) {
      new route53.ARecord(this, 'AliasWWW', {
        zone,
        recordName: `www.${domainName}`,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
      });
      new route53.AaaaRecord(this, 'AliasWWWAAAA', {
        zone,
        recordName: `www.${domainName}`,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: siteBucket.bucketName,
      description: 'S3 bucket for site content (private)'
    });
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.domainName,
      description: 'CloudFront distribution domain'
    });
    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
      description: 'ACM certificate ARN (us-east-1)'
    });
  }
}
