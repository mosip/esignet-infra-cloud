#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EsignetAwsAutomationStack } from '../lib/esignet-aws-automation-stack';

import { StackProps } from "aws-cdk-lib";
import { ConfigProps, getConfig } from "../lib/config";

//AWS Stacks
import { vpcStack } from "../lib/vpc-stack";
import { rdsStack } from "../lib/rds-stack";
import { eksec2Stack } from "../lib/eks-ec2-stack";
import { mosipcommonhelmStack } from '../lib/mosipcommon-helm-stack';
import { esignetbootstraphelmStack } from '../lib/esignetbootstrap-helm-stack';
import { keycloakhelmStack } from '../lib/keycloak-helm-stack';
import { keycloakinithelmStack } from '../lib/keycloakinit-helm-stack';
import { postgresinithelmStack } from '../lib/postgresinit-helm-stack';
import { esignetinithelmStack } from '../lib/esignetinit-helm-stack';
import { esignethelmStack } from '../lib/esignet-helm-stack';
import { oidcuihelmStack } from '../lib/oidcui-helm-stack';
import { LoadBalancerStack } from '../lib/ec2-loadbalancer-stack';

const config = getConfig();
const app = new cdk.App();

type AwsEnvStackProps = StackProps & {
  config: ConfigProps;
};

const MY_AWS_ENV_STACK_PROPS: AwsEnvStackProps = {
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
};

// Provision required VPC network & subnets
// const infra = new vpcStack(app, "vpcstackesignet", MY_AWS_ENV_STACK_PROPS);
const infra2 = new vpcStack(app, "vpcstackesignetdemo", MY_AWS_ENV_STACK_PROPS);


// Provision target RDS data store
/*const rds = new rdsStack(app, "rdsstackesignet", {
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
  vpc: infra.vpc,
  rdsuser: config.RDS_USER,
  rdspassword: config.RDS_PASSWORD,
});*/


// Provision required VPC network & subnets
const loadbalancer = new LoadBalancerStack(app, "albstack", {  
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
  vpc: infra2.vpc
});

loadbalancer.addDependency(infra2);


const rds2 = new rdsStack(app, "rdsstackesignetdemo", {
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
  vpc: infra2.vpc,
  rdsuser: config.RDS_USER,
  rdspassword: config.RDS_PASSWORD,
});

// Provision target EKS with Fargate Cluster within the VPC
/*const eksCluster = new eksec2Stack(app, "eksec2stackesignet", {
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
  vpc: infra.vpc,
}); */

const eksCluster = new eksec2Stack(app, "eksec2stackesignetdemo", {
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
  vpc: infra2.vpc,
});

// Run HELM charts for the RC2 applications in the provisioned EKS cluster
const mosipCommonHelm = new mosipcommonhelmStack(app, "mosipcommonhelmStackesignetdemo", {
 env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config: config,
  eksCluster: eksCluster.eksCluster

});


const esignetbootstraphelm = new esignetbootstraphelmStack(app, "esignetbootstraphelmStackesignetdemo", {
   env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },

  config: config,
  rdsHost: rds2.rdsHost,
  RDS_PASSWORD: config.RDS_PASSWORD,
  RDS_USER: config.RDS_USER,
  eksCluster: eksCluster.eksCluster,
  albDNS: loadbalancer.albDNS
  

});

esignetbootstraphelm.addDependency(mosipCommonHelm);

const keycloakhelm = new keycloakhelmStack(app, "keycloakhelmStackesignetdemo", {
   env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },

  config: config,
  rdsHost: rds2.rdsHost,
  RDS_PASSWORD: config.RDS_PASSWORD,
  RDS_USER: config.RDS_USER,
  eksCluster: eksCluster.eksCluster

});

keycloakhelm.addDependency(esignetbootstraphelm);


const keycloakinithelm = new keycloakinithelmStack(app, "keycloakinithelmStackesignetdemo", {
   env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },

  config: config,
  eksCluster: eksCluster.eksCluster

});

keycloakinithelm.addDependency(keycloakhelm);

const postgresinithelm = new postgresinithelmStack(app, "postgresinithelmStackesignetdemo", {
   env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },

  config: config,
  rdsHost: rds2.rdsHost,
  RDS_PASSWORD: config.RDS_PASSWORD,
  eksCluster: eksCluster.eksCluster

});

postgresinithelm.addDependency(keycloakinithelm);

const esignetinithelm = new esignetinithelmStack(app, "esignetinithelmStackesignetdemo", {
   env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },

  config: config,
  rdsHost: rds2.rdsHost,
  RDS_PASSWORD: config.RDS_PASSWORD,
  RDS_USER: config.RDS_USER,
  eksCluster: eksCluster.eksCluster

});

esignetinithelm.addDependency(postgresinithelm);

const esignetthelm = new esignethelmStack(app, "esignethelmStackesignetdemo", {
   env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },

  config: config,
  eksCluster: eksCluster.eksCluster

});

esignetthelm.addDependency(esignetinithelm);

const oidcuihelm = new oidcuihelmStack(app, "oidcuihelmStackesignetdemo", {
   env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },

  config: config,
  eksCluster: eksCluster.eksCluster

});

oidcuihelm.addDependency(esignetthelm);




