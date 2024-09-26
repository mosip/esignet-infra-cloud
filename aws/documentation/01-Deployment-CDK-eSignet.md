## AWS CDK One Click Deployment ##

### CDK Stack Overview
The CDK comprises stacks designed to perform unique provisioning steps, making the overall automation modular.

  1. CDK Stacks provisioning AWS Resources
  2. CDK Stacks provisioning HELM execution charts
  3. CDK Configuration files

#### 1. CDK Stacks provisioning AWS Resources
Designed and implemented Infrastructure as Code (IaC) using AWS CDK to automate and consistently provision AWS resources. The table below lists the stacks and their corresponding default provisioned AWS resources.

| CDK Stack   name   | File name/path   | Description                                                                                       | Default AWS Resources                                                                                                                                  |
|--------------------|------------------|---------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| vpcstackesignet    | lib/vpc-stack.ts     | Foundation stack creation including VPC,   Subnets, Route   tables, Internet Gateway, NAT Gateway | One VPC with 6 subnets, divided into 2 public subnets, 2   private subnets, and 2 database subnets across two availability zones.                      |
| rdsstackesignet    | lib/rds-stack.ts     | Creates RDS Aurora Postgresql                                                                     | Aurora PostgreSQL Serverless v2 with provisioned capacity, deployed in   the database subnets.                                                         |
| eksec2stackesignet | lib/eks-ec2-stack.ts | Creates EKS EC2 Cluster                                                                           | An Amazon EKS cluster   provisioned with on-demand EC2 instances of the t2.medium instance class. All   EC2 instances are deployed in private subnets. |
| albstack      | lib/ec2-loadbalancer-stack.ts      | Creates AWS Application Loadbalancer                                                                                             | Provisioned internet facing loadbalancer in public subnet |

#### 2. CDK Stacks provisioning HELM execution charts
Helm charts were implemented using AWS CDK to automate and consistently deploy eSignet services. The table below lists the stacks and their corresponding EKS pod names.

| CDK   Stack name                 | File name/path                     | Description                                                                                                                                                                                | Pods Deployed                                              |
|----------------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
 | mosipcommonhelmStackesignet      | lib/mosipcommon-helm-stack.ts      | Deploys esignet dependent services such as  softhsm, artifactory, kafka and kafka UI.                                                                                                      | softhsm, kafka-0, kafka-zookeeper-0, kafka-ui, artifactory |
| esignetbootstraphelmStackesignet | lib/esignetbootstrap-helm-stack.ts | Creates esignet and keycloak databases in Amazon RDS and   creates  global configmap                                                                                                       | esignet-bootstrap-job                                      |
| keycloakhelmStackesignet         | lib/keycloak-helm-stack.ts         | Deploys keycloak service to provide authentication for eSignet   APIs                                                                                                                      | keycloak-0                                                 |
| keycloakinithelmStackesignet     | lib/keycloakinit-helm-stack.ts     | Initialize keycloak services by creating roles and clients in   keycloak                                                                                                                   | keycloak-init                                              |
| postgresinithelmStackesignet     | lib/postgresinit-helm-stack.ts     | Run DB scripts for esignet    services                                                                                                                                                     | db-esignet-init-job                                        |
| esignetinithelmStackesignet      | lib/esignetinit-helm-stack.ts      | Create esignet springboot property file as config map by   substituting all required values from dependent services such as keycloak,   softhsm and artifactory and kafka                  | esignet-init-job                                           |
| esignethelmStackesignet          | lib/esignet-helm-stack.ts          | Deploys eSignet core service                                                                                                                                                               | esignet                                                    |
| oidcuihelmStackesignet           | lib/oidcui-helm-stack.ts           | Deploys eSignet UI(OIDC) service.                                                                                                                                                          | oidc-ui                                                    |

#### 3. CDK Config Files
CDK configuration files for inputs to AWS services and Helm charts and CDK executions. The table below lists the filename and description

| File   name/path              | Description                                                                                                                                                    |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| bin/esignet-aws-automation.ts | Entrypoint of the CDK application                                                                                                                              |
| lib/config.ts                 | Input file for CDK Deployment including defaults ( AWS   Account Number,   Region, AWS services, Helm chart details and eSignet configurations etc) |


### Prerequisties:

Before deploying CDK stacks, ensure you have the following prerequisites in place:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. [Node.js](https://nodejs.org/en/download/package-manager)
3. Access to AWS account

### Prepare your environment
```
# Install TypeScript globally for CDK
npm i -g typescript

# Install aws cdk
npm i -g aws-cdk

# Clone the repository 
git clone <repo_url>
cd esignet-aws-automation

# Install the CDK application
npm i

# cdk bootstrap [aws://<ACCOUNT-NUMBER>/<REGION>]
cdk bootstrap aws://<ACCOUNT-NUMBER>/<REGION>
```

#### Update environment variables, with your preferred editor. Open '.env' file in the CDK app.

**Mandatory environment variables**
| ENVIRONMENT VARIABLES | EXAMPLE VALUE      | DESCRIPTION                                                                                                                                                                                                                                                                                                              |
|-----------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| REGION                | ap-south-1         | AWS region                                                                                                                                                                                                                                                                                                               |
| ACCOUNT               | 1234567890         | AWS 12 digit account number                                                                                                                                                                                                                                                                                              |
| CIDR                  | 10.20.0.0/16       | VPC CIDR, change it as per your environment                                                                                                                                                                                                                                                                              |
| MAX_AZS               | 2                  | AWS Availability Zone count, default 2                                                                                                                                                                                                                                                                                   |
| RDS_USER              | postgres           | Database user name for core registory service, default 'postgres'                                                                                                                                                                                                                                                        |
| RDS_PASSWORD          | xxxxxxxx           | Database password, used while DB creation and passed down to Esignet services helm chart                                                                                                                                                                                                                                 |
| EKS_CLUSTER_NAME      | ekscluster-esignet | AWS EKS Cluster name                                                                                                                                                                                                                                                                                                     |
| LOADBALANCER_NAME     | esignet-alb        | Amazon Application Load balancer name for esignet and keycloak. Both the  services uses the same loadbalancer and routes the application through   granular rules                                                                                                                                                        |
| CERTIFICATE_ARN       | xxxxxxxxxx         | The Amazon certificate ARN is essential for enabling HTTPS on the AWS Load Balancer. If you don't have a domain, you can generate an SSL certificate yourself and upload it to the Amazon Certificate Manager. Afterward, create the certificate. Keycloak service operates exclusively over HTTPS, making it mandatory. |

**Optional environment variables**
| ENVIRONMENT   VARIABLES | EXAMPLE VALUE                                                                       | DESCRIPTION                                                                                                                                                                                                                                               |
|-------------------------|-------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DOMAIN                  | sandbox.demodpgs.net                                                                | Specify the domain name to be used by esignet and Keycloak services. If you have a custom domain, enter it here. Otherwise, leave the variable empty. CDK will substitute the AWS Load Balancer DNS name wherever it is deployed in the application.                                                                                                                                                                                     |


**Deploy CDK**
```
# After updating the .env file, run AWS CDK commands to begin with deploy

# Emits the synthesized CloudFormation template
cdk synth 

# List CDK stack
cdk list

# Deploy single stack  - vpcstackesignet, rdsstackesignet, eksec2stackesignet, albstack, oidcuihelmStackesignet
# oidcuihelmStackesignet will deploy the stack in defined order mentioned CDK app. It deploys the stacks in the following order: mosipcommonhelmStackesignet, esignetbootstraphelmStackesignet, keycloakhelmStackesignet, keycloakinithelmStackesignet, postgresinithelmStackesignet, esignetinithelmStackesignet, esignethelmStackesignet and oidcuihelmStackesignet
cdk deploy <stack_name>

# Alternatively you could also deploy all stacks and CDK would handle the sequence
cdk deploy --all 
```

After installing all the CDK stacks, verify the AWS services in the AWS web console. The stack 'oidcuihelmStackesignet' installs the eSignet UI and esignet API helm chart, esignet init helm chart, postgres init helm chart, keycloak init helm chart, keycloak helm chart, esignet bootstrap helm chart, common helm charts (softhsm, kafka, kafka-ui, artifactory)  in the EKS cluster. It is recommended to review the [Deployment through Helm](02-Deployment-Helm-eSignet.md) guide to become familiar with Helm charts, services, and parameters. This will be beneficial if you opt to run the Helm chart separately from the CDK, following the "Mode Two: Direct Helm Chart Invocation" approach for installing the eSignet stack.

Follow the post installation steps to start using eSignet services

* [Post Installation Procedure](03-Post-Installation-Procedure.md)

**Lastly, if you wish to clean up, run 'AWS CDK destroy' to remove all AWS resources that were created by it.**
```
cdk destroy [STACKS..]
```
