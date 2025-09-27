import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StaticSiteWithCFAcmStack } from "../lib/static-site-cloudfront";
import { DOMAIN_NAME } from "../lib/domain-config";
import * as dotenv from "dotenv";
dotenv.config();

const app = new cdk.App();

const account = process.env.CDK_ACCOUNT!;
const region = process.env.CDK_REGION!;
const stackName = process.env.CDK_STACK_NAME || "StaticSiteStack";

new StaticSiteWithCFAcmStack(app, stackName, {
  env: { account, region },
  domainName: DOMAIN_NAME,
  includeWww: true,
  priceClass: "PriceClass_100",
  removalPolicy: "RETAIN",
});
