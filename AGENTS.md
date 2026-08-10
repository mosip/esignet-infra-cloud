# AGENTS.md

## Repository Overview

This repo holds the "one-click deployment" automation for eSignet on public
cloud. It is infrastructure-as-code (IaC), not an eSignet application
service — there is no source code for eSignet itself here, only the
scripts, Terraform, CDK, and Helm values used to stand up eSignet on a
cloud provider.

There are exactly two top-level modules, one per cloud provider, and they
are independent of each other (different languages, different tools, no
shared code):

| Folder | Cloud | Guide |
|--------|-------|-------|
| [`aws/`](aws/AGENTS.md) | Amazon Web Services | [aws/AGENTS.md](aws/AGENTS.md) |
| [`gcp/`](gcp/AGENTS.md) | Google Cloud Platform | [gcp/AGENTS.md](gcp/AGENTS.md) |

Read the subfolder guide for the module you are changing — this root file
only covers what is common to both.

## Technology Stack

- `aws/`: AWS CDK (TypeScript) for AWS resource provisioning, plus Helm
  charts run from CDK for deploying eSignet services onto EKS.
- `gcp/`: Terraform for GCP resource provisioning, Google Cloud Build YAML
  pipelines that wrap `terraform plan`/`apply`, and Helm charts for
  deploying eSignet services onto GKE.
- No application source code (Java/Spring, etc.) lives in this repo.

## Build & Test Commands

There is no single build/test command for the whole repo — each module has
its own tool. See `aws/AGENTS.md` for CDK commands (`cdk synth`, `cdk
deploy`, `cdk destroy`, `npm test`) and `gcp/AGENTS.md` for Terraform /
Cloud Build commands (`terraform plan`, `terraform apply`, `gcloud builds
submit`).

## Configuration

Both modules read environment-specific values from a checked-in `.env`
file (`aws/.env`, `gcp/.env`) rather than a `.env.example` template. Both
files are already present in the repository with sample/demo values (an
AWS account ID, RDS password, domain, and certificate ARN in `aws/.env`;
Helm chart/image versions in `gcp/.env`). Never commit real account IDs,
passwords, ARNs, or other environment-specific secrets when editing these
files — replace the sample values locally and keep the diff you push
limited to what the task actually requires.

## Project Structure Notes

```text
.
├── aws/   AWS CDK (TypeScript) + Helm — see aws/AGENTS.md
└── gcp/   Terraform + Cloud Build + Helm — see gcp/AGENTS.md
```

There is no root README, no CI workflow directory (`.github/workflows`)
in this repository, and no other `AGENTS.md`/`CLAUDE.md` files exist yet
— this change adds the first ones.

## Development Workflow

1. Work inside the one module (`aws/` or `gcp/`) your change concerns;
   avoid cross-editing both unless the change genuinely applies to both.
2. Follow the module-specific guide for how to validate a change (CDK
   synth, Terraform plan, etc.) before proposing it.
3. Keep documentation (`README.md`, `documentation/*.md` under `aws/`)
   in sync with any change to deployment steps, stack names, or Helm
   chart versions.

## Pull Request Guidelines

- This repo has no CI workflows, so there is no automated check to lean
  on — describe in the PR body what you validated manually (e.g. `cdk
  synth` succeeded, `terraform plan` output reviewed).
- Reference the tracking issue/ticket in the PR description.
- Keep PRs scoped to one module (`aws/` or `gcp/`) where possible.

## Repository-Specific Considerations

- This is IaC for real cloud infrastructure. Changes here can provision
  or, if run carelessly, destroy real AWS/GCP resources (databases, EKS/
  GKE clusters, load balancers). Never run `cdk deploy`, `cdk destroy`,
  `terraform apply`, `terraform destroy`, or the `gcloud builds submit
  ... destroy-script.yaml` pipelines against a real account/project as
  part of a routine code change — those are operator actions, not part
  of writing or reviewing code.
- Helm chart archives (`.tgz`) and `index.yaml` are vendored under
  `aws/packages/`; don't hand-edit these, regenerate/re-fetch them
  through the documented process instead.

## Agent rules

### Do

1. Read the relevant module's `AGENTS.md` (`aws/AGENTS.md` or
   `gcp/AGENTS.md`) before touching files in that folder.
2. Verify claims about commands, versions, and file paths against the
   actual files in the repo before writing documentation or comments.
3. Treat `aws/.env` and `gcp/.env` as configuration templates that
   already contain sample values — replace samples with your own
   locally, and keep secrets out of anything you commit or push.
4. Flag any command that can create, modify, or destroy cloud resources
   (`cdk deploy`/`destroy`, `terraform apply`/`destroy`, Cloud Build
   destroy pipelines) clearly when suggesting it.

### Do not

1. Do not run `cdk deploy`, `cdk destroy`, `terraform apply`, `terraform
   destroy`, or a Cloud Build destroy pipeline against a real cloud
   account/project without the user explicitly asking for that specific
   action.
2. Do not commit real AWS account IDs, database passwords, certificate
   ARNs, GCP project IDs, or other secrets — even though sample values
   already exist in `aws/.env`/`gcp/.env`, don't replace them with real
   ones in a commit.
3. Do not assume a CI pipeline will catch mistakes — this repo has no
   `.github/workflows`.
4. Do not hand-edit the vendored Helm chart archives under
   `aws/packages/`.
