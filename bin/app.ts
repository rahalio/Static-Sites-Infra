import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StaticSiteWithCFAcmStack } from "../lib/static-site-cloudfront";
import { DOMAIN_NAME } from "../lib/domain-config";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.aws" });

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID || process.env.CDK_ACCOUNT;
const region = process.env.AWS_REGION || process.env.CDK_REGION;

console.log("Account:", account, "Region:", region);
if (!account || !region) {
  throw new Error(
    "AWS_ACCOUNT_ID and AWS_REGION must be set in your environment before deploying."
  );
}
const stackName = process.env.CDK_STACK_NAME || "StaticSiteStack";

new StaticSiteWithCFAcmStack(app, stackName, {
  env: { account, region },
  domainName: DOMAIN_NAME,
  includeWww: true,
  priceClass: "PriceClass_100",
  removalPolicy: "RETAIN",
});
