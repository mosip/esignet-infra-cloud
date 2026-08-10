# AGENTS.md

Scope: this file covers the `aws/` module only. See the [root
AGENTS.md](../AGENTS.md) for the repo-wide overview.

## Repository Overview

`aws/` is an AWS CDK v2 (TypeScript) application, `esignet-aws-automation`,
that provisions AWS infrastructure (VPC, RDS Aurora PostgreSQL, EKS on
EC2, an Application Load Balancer) and then deploys eSignet and its
dependent services (Keycloak, SoftHSM, Kafka, Artifactory, eSignet API,
OIDC UI, etc.) into that EKS cluster via Helm charts invoked from CDK
stacks.

## Technology Stack

- AWS CDK v2 (`aws-cdk-lib` 2.133.0), TypeScript (~5.3.3)
- Jest + ts-jest for tests
- Helm charts (vendored as `.tgz` under `aws/packages/`) deployed from
  CDK Helm-chart constructs
- `dotenv` to load `aws/.env` into `lib/config.ts`

## Build & Test Commands

Run these from inside `aws/`:

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run unit tests (Jest)
npm test

# Emit the synthesized CloudFormation templates (safe, no AWS calls)
npx cdk synth

# List the stacks CDK would deploy
npx cdk list
```

`npm run watch` recompiles TypeScript on change; it does not deploy
anything.

### Deploying (provisions real AWS resources)

These commands talk to a real AWS account and create or destroy billed
resources. Only run them when the user explicitly asks to deploy/tear
down infrastructure, and only after `aws/.env` has been filled in with
real values for that account:

```bash
# One-time per account/region
npx cdk bootstrap aws://ACCOUNT_ID/REGION

# Deploy one named stack
npx cdk deploy STACK_NAME

# Deploy every stack, letting CDK resolve the dependency order
npx cdk deploy --all

# Tear down stacks created by this app
npx cdk destroy STACKS
```

## Configuration

All CDK input values are read from `aws/.env` (loaded by
`aws/lib/config.ts` via `dotenv`) — this file is committed to the repo
with sample/demo values already filled in (AWS account ID, RDS password,
domain, ACM certificate ARN, EKS cluster name, load balancer names).
Edit it in place with values for your own AWS account before running any
`cdk` command; do not commit your real values back.

Mandatory variables: `ACCOUNT`, `RDS_PASSWORD`, `CERTIFICATE_ARN`.
Optional (have defaults in `lib/config.ts`): `REGION` (default
`ap-south-1`), `CIDR`, `MAX_AZS` (default 2), `RDS_USER` (default
`postgres`), `EKS_CLUSTER_NAME` (default `ekscluster-esignet-demo`),
`DOMAIN`, `KEYCLOAK_LOADBALANCER_NAME`, `ESIGNET_LOADBALANCER_NAME`. Full
descriptions are in
[`documentation/01-Deployment-CDK-eSignet.md`](documentation/01-Deployment-CDK-eSignet.md).

## Project Structure Notes

```text
aws/
├── bin/esignet-aws-automation.ts   CDK app entrypoint
├── lib/                            One file per CDK stack
│   ├── config.ts                   Loads aws/.env into typed config
│   ├── vpc-stack.ts, rds-stack.ts, eks-ec2-stack.ts,
│   │   ec2-loadbalancer-stack.ts   AWS resource stacks
│   └── *-helm-stack.ts             Stacks that install Helm charts
│       (mosipcommon, esignetbootstrap, keycloak, keycloakinit,
│       postgresinit, esignetinit, esignet, oidcui)
├── test/                           Jest tests (esignet-aws-automation.test.ts)
├── packages/                       Vendored Helm chart archives (.tgz) + index.yaml
├── documentation/                  Step-by-step deployment guides
├── helm/                           Helm chart sources used by the stacks
├── kafka-cdk/                      Kafka-related CDK code
├── cdk.json, cdk.context.json      CDK app/runtime configuration
└── .env                            CDK input values (see Configuration)
```

Stack-to-file mapping and the Helm chart deployment order are documented
in full in
[`documentation/01-Deployment-CDK-eSignet.md`](documentation/01-Deployment-CDK-eSignet.md).
Deploying the Helm charts directly (without CDK) is covered in
[`documentation/02-Deployment-Helm-eSignet.md`](documentation/02-Deployment-Helm-eSignet.md),
and post-install steps are in
[`documentation/03-Post-Installation-Procedure.md`](documentation/03-Post-Installation-Procedure.md).

## Development Workflow

1. Change the relevant stack file under `lib/`.
2. Run `npm run build` and `npx cdk synth` to confirm the stack still
   synthesizes without errors.
3. Run `npm test` for any affected unit tests.
4. Update the matching table/section in
   `documentation/01-Deployment-CDK-eSignet.md` if you add, rename, or
   remove a stack, or change a mandatory/optional `.env` variable.
5. Do not run `cdk deploy`/`cdk destroy` as part of routine code changes
   — that provisions or destroys real AWS resources.

## Pull Request Guidelines

- State which stack(s) you changed and what `cdk synth`/`npm test`
  output you checked.
- If you changed `lib/config.ts` or added a new `.env` variable, update
  the variable table in `documentation/01-Deployment-CDK-eSignet.md` in
  the same PR.
- No CI workflow runs these checks automatically in this repo — call out
  what you validated manually in the PR description.

## Repository-Specific Considerations

- `aws/.env` already contains realistic-looking sample values (an AWS
  account number, RDS password, domain, certificate ARN). Treat these as
  placeholders to replace locally, not as real credentials to reuse or
  commit.
- `npm run watch` and `.gitignore` exclude compiled `*.js`/`*.d.ts`
  output and `cdk.out/` — don't hand-commit build output.
- Helm chart archives under `packages/` are vendored binaries; update
  them through the project's normal chart-packaging process rather than
  editing the `.tgz` files directly.

## Agent rules

### Do

1. Run `npm run build`, `npx cdk synth`, and `npm test` to validate
   changes to stacks or config.
2. Keep `documentation/01-Deployment-CDK-eSignet.md` in sync with stack
   and `.env` variable changes.
3. Treat every value in `aws/.env` as a local override — edit it in
   place for local runs, but do not push real secrets.

### Do not

1. Do not run `npx cdk deploy` or `npx cdk destroy` against a real AWS
   account unless explicitly asked to deploy/tear down infrastructure.
2. Do not commit a real AWS account ID, RDS password, or certificate ARN
   into `aws/.env`.
3. Do not hand-edit the `.tgz` Helm chart archives under `packages/`.
