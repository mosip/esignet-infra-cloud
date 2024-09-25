import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
//import * as cdk from '@aws-cdk/core';
//import * as s3 from '@aws-cdk/aws-s3';
import { Construct } from "constructs";
import { ConfigProps } from "./config";

import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";



export interface LoadBalancerStackProps extends cdk.StackProps {
    config: ConfigProps;
    vpc: ec2.Vpc;

}


export class LoadBalancerStack extends cdk.Stack {
    public readonly ec2Alb: elbv2.ApplicationLoadBalancer;
    public readonly albDNS : string;
    constructor(scope: Construct, id: string, props: LoadBalancerStackProps) {
    super(scope, id, props);
    const vpc = props.vpc;
    const { config } = props;
    this.ec2Alb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
        vpc,
        internetFacing: true,
        loadBalancerName: props.config.OIDC_LOADBALANCER.name
      });

    this.albDNS = this.ec2Alb.loadBalancerDnsName;
    new cdk.CfnOutput(this, String("Load Balancer DNS"), {
        value: this.ec2Alb.loadBalancerDnsName
    });

    
 }
}
