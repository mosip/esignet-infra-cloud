# AGENTS.md

Scope: this file covers the `gcp/` module only. See the [root
AGENTS.md](../AGENTS.md) for the repo-wide overview.

## Repository Overview

`gcp/` is the one-click deployment automation for eSignet on Google
Cloud. It provisions infrastructure with Terraform, orchestrates that
Terraform through Google Cloud Build YAML pipelines, and then deploys
eSignet and its dependent services (SoftHSM, Artifactory, Keycloak,
Postgres-init, eSignet, OIDC UI, Keycloak-init, optional mock identity
system) onto GKE with Helm.

Deployment is split into two stages: **pre-config** (Terraform, creates
the landing-zone infra) and **apps** (deploys the Helm-based services).
Each stage has its own Cloud Build pipeline under `builds/`.

## Technology Stack

- Terraform (pinned to `hashicorp/terraform:1.6.1` in the Cloud Build
  steps) for GCP resource provisioning
- Google Cloud Build (`builds/*/deploy-script.yaml`,
  `builds/*/destroy-script.yaml`) as the wrapper that runs
  `terraform init` / `plan` / `apply` (or `plan -destroy` / `apply` for
  teardown)
- Helm charts for deploying eSignet services onto GKE
- `gcloud` / `kubectl` CLIs for setup and cluster access

## Build & Test Commands (how to plan/apply)

There is no unit-test suite here; validation is done by running
Terraform/Cloud Build against a GCP project. Run from `gcp/` unless
noted:

```bash
# One-time setup: auth, project config, enabling services, service account
bash deployments/scripts/setup_gcp.sh

# Terraform state bucket (once per project)
PROJECT_ID="your-project-id"
REGION="asia-south1"
gcloud storage buckets create "gs://${PROJECT_ID}-esignet-state" \
  --project="${PROJECT_ID}" --default-storage-class=STANDARD \
  --location="${REGION}" --uniform-bucket-level-access
```

### Provisioning infrastructure (Terraform via Cloud Build — provisions real resources)

```bash
PROJECT_ID="your-project-id"
SERVICE_ACCOUNT="your-project-id-sa@your-project-id.iam.gserviceaccount.com"

gcloud builds submit --config="./builds/infra/deploy-script.yaml" \
  --project="${PROJECT_ID}" \
  --substitutions=_PROJECT_ID_="${PROJECT_ID}",_SERVICE_ACCOUNT_="${SERVICE_ACCOUNT}",_LOG_BUCKET_="${PROJECT_ID}-esignet-state"
```

The pipeline runs, in order, `terraform init`, `terraform plan -out
out.plan -var-file=terraform-variables/dev/pre-config/pre-config.tfvars
...`, then `terraform apply out.plan` inside
`terraform-scripts/pre-config/`.

### Destroying infrastructure (destructive — real resources, real data loss)

```bash
gcloud builds submit --config="./builds/infra/destroy-script.yaml" \
  --project="${PROJECT_ID}" \
  --substitutions=_PROJECT_ID_="${PROJECT_ID}",_SERVICE_ACCOUNT_="${SERVICE_ACCOUNT}",_LOG_BUCKET_="${PROJECT_ID}-esignet-state"
```

This runs `terraform plan -destroy` then `terraform apply` on that
destroy plan — it deletes the infrastructure the deploy pipeline
created. Never run this against a real project as part of a routine
change.

### Deploying / destroying services (Helm, via Cloud Build)

```bash
REGION="asia-south1"
EMAIL_ID="you@example.com"
DOMAIN_NAME="your.domain.example"
ENABLE_MOCK=false

gcloud builds submit --config="./builds/apps/deploy-script.yaml" \
  --region="${REGION}" --project="${PROJECT_ID}" \
  --substitutions=_PROJECT_ID_="${PROJECT_ID}",_REGION_="${REGION}",_LOG_BUCKET_="${PROJECT_ID}-esignet-state",_EMAIL_ID_="${EMAIL_ID}",_DOMAIN_="${DOMAIN_NAME}",_SERVICE_ACCOUNT_="${SERVICE_ACCOUNT}",_ENABLE_MOCK_="${ENABLE_MOCK}"
```

`builds/apps/destroy-script.yaml` tears the services back down with the
matching substitutions — same caution as above applies.

## Configuration

`gcp/.env` holds the Helm chart versions and Docker image/versions for
each service (softhsm, artifactory, keycloak, postgres-init, esignet,
oidc-ui, keycloak-init, mock-identity-system); update it to change which
chart/image versions get deployed.

`terraform-variables/dev/pre-config/pre-config.tfvars` holds the actual
Terraform variable values for the `pre-config` stage (matched against
`terraform-scripts/pre-config/variables.tf`). Cloud Build substitution
variables (`_PROJECT_ID_`, `_SERVICE_ACCOUNT_`, `_LOG_BUCKET_`, `_REGION_`,
`_EMAIL_ID_`, `_DOMAIN_`, `_ENABLE_MOCK_`) are passed on the command line
via `--substitutions`, not stored in a file — do not hardcode real
project IDs or service account emails into the YAML pipeline files.

`.terraform/` and `**/*.plan` are gitignored at the repo root — Terraform
local state/plan artifacts should never be committed.

## Project Structure Notes

```text
gcp/
├── .env                        Helm chart/image versions
├── assets/                     Architecture diagrams
├── builds/
│   ├── infra/                  Cloud Build pipelines for Terraform pre-config (deploy/destroy)
│   └── apps/                   Cloud Build pipelines for Helm app deployment (deploy/destroy)
├── db_scripts/                 Database setup scripts
├── deployments/
│   ├── configs/                Config files used during deployment
│   └── scripts/setup_gcp.sh    GCP auth/project/service-account bootstrap script
├── postman_collections/        Postman collection + environment for the OIDC demo flow
├── terraform-scripts/
│   └── pre-config/              backend.tf, pre-config.tf, variables.tf
└── terraform-variables/
    └── dev/pre-config/pre-config.tfvars   Actual values for variables.tf
```

Only the `dev` / `pre-config` Terraform stage exists today — there is no
`setup`/main-infra Terraform stage checked in yet, even though the
README describes deployment as split into "Pre-Config" and "Setup"
stages; the "apps" side of that second stage is instead handled by the
Helm-based `builds/apps/*.yaml` pipelines.

## Development Workflow

1. Change Terraform under `terraform-scripts/pre-config/` and the
   matching values in `terraform-variables/dev/pre-config/pre-config.tfvars`
   together.
2. Validate locally with `terraform fmt` / `terraform validate` /
   `terraform plan` against a sandbox project before proposing a change
   — do not `apply` as part of routine review.
3. If you change a Helm chart or image version, update `gcp/.env` and
   the version table in `gcp/README.md` together.
4. Keep `README.md` in sync with any change to the deployment steps or
   folder layout.

## Pull Request Guidelines

- State which stage (`infra`/Terraform vs `apps`/Helm) your change
  touches, and what you validated (e.g. `terraform validate`, `terraform
  plan` output reviewed against a sandbox project).
- No CI workflow exists in this repo to run these checks automatically —
  call out manual validation in the PR description.
- Do not include real project IDs, service account emails, or `.tfvars`
  values from a real environment in PR descriptions or screenshots.

## Repository-Specific Considerations

- Everything under `builds/` and `terraform-scripts/` can provision or
  destroy real GCP infrastructure (GKE cluster, Cloud SQL, networking).
  Treat any `deploy-script.yaml` / `destroy-script.yaml` invocation, and
  any direct `terraform apply`/`terraform destroy`, as an operator
  action requiring explicit user confirmation — never run it as a side
  effect of a code change.
- The destroy pipelines run `terraform plan -destroy` then `apply` on
  that plan, i.e. they permanently remove the resources the deploy
  pipeline created (including the database) — flag this clearly before
  suggesting it.
- Secrets at runtime (DB password, Keycloak admin password, OIDC client
  secret) are fetched from GCP Secret Manager / Kubernetes secrets via
  `gcloud secrets versions access` and `kubectl get secret`, not stored
  in this repo — see the "Steps to access..." sections of
  [`README.md`](README.md).

## Agent rules

### Do

1. Validate Terraform changes with `terraform fmt`/`validate`/`plan`
   against a sandbox project, not the org's real project.
2. Keep `gcp/.env`, `gcp/README.md`, and
   `terraform-variables/dev/pre-config/pre-config.tfvars` consistent
   with each other when changing chart versions or Terraform variables.
3. Pass GCP identifiers (`_PROJECT_ID_`, `_SERVICE_ACCOUNT_`, etc.) as
   Cloud Build `--substitutions` on the command line, matching the
   existing pattern, instead of hardcoding them into YAML.

### Do not

1. Do not run `gcloud builds submit ... destroy-script.yaml` or
   `terraform destroy` against a real GCP project unless explicitly
   asked to tear down infrastructure.
2. Do not run the `deploy-script.yaml` pipelines or `terraform apply`
   against a real project as part of routine code review or refactors.
3. Do not commit `.terraform/` directories, `*.plan` files, or real
   project IDs/service account emails into tracked files.
