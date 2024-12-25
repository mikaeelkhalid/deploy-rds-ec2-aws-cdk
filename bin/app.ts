#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { DeployRDSEC2Stack } from '../stacks';

const app = new App();

new DeployRDSEC2Stack(app, 'rds-ec2-stack', {
  stackName: 'rds-ec2-stack',
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
