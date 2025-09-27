import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StaticSiteWithCFAcmStack } from "../lib/static-site-cloudfront";
import * as dotenv from "dotenv";
dotenv.config();

const app = new cdk.App();

const account = process.env.CDK_ACCOUNT!;
const region = process.env.CDK_REGION!;

new StaticSiteWithCFAcmStack(app, "VoltgraphSiteStack", {
  env: { account, region },
  domainName: "voltgraph.com",
  includeWww: true,
  priceClass: "PriceClass_100",
  removalPolicy: "RETAIN",
});
