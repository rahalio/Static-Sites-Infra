import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StaticSitesStack, SiteConfig } from "../lib/static-sites-stack";

const app = new cdk.App();

// Single site: voltgraph.com
const sites: SiteConfig[] = [
  {
    siteName: "voltgraph-com",
    sourcePath: "sites/voltgraph-com",
    indexDocument: "index.html",
    errorDocument: "404.html",
    // bucketName: 'voltgraph-com-static-site' // (optional) set if you want a fixed name; must be globally unique
  },
];

new StaticSitesStack(app, "StaticSitesStack", {
  env: {
    // account: process.env.CDK_DEFAULT_ACCOUNT,
    // region: process.env.CDK_DEFAULT_REGION
  },
  sites,
  defaultIndexDocument:
    app.node.tryGetContext("defaultIndexDoc") ?? "index.html",
  defaultErrorDocument: app.node.tryGetContext("defaultErrorDoc") ?? "404.html",
  publicReadAccess: true,
  removalPolicy: "RETAIN",
});
