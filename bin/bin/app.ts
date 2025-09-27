import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticSiteWithCFAcmStack } from '../lib/static-site-cloudfront';

const app = new cdk.App();

new StaticSiteWithCFAcmStack(app, 'VoltgraphSiteStack', {
  env: {
    // account: process.env.CDK_DEFAULT_ACCOUNT,
    // region: process.env.CDK_DEFAULT_REGION
  },
  domainName: 'voltgraph.com',
  includeWww: true,
  priceClass: 'PriceClass_100', // or 'PriceClass_200' | 'PriceClass_All'
  removalPolicy: 'RETAIN'
});
