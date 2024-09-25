import * as dotenv from "dotenv";
import path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export interface ChartMap {
  chartName: string;
  namespace: string;
}

interface MapCollection {
  [key: string]: ChartMap;
}
interface loadbalancer{
  name: string;
  domain: string;
}

export type ConfigProps = {
  REGION: string;
  ACCOUNT: string;
  CIDR: string;
  MAX_AZS: number;
  CHART: string;
  REPOSITORY: string;
  NAMESPACE: string;
  RDS_USER: string;
  RDS_PASSWORD: string;
  RDS_SEC_GRP_INGRESS: string;
 // ROLE_ARN: string;
  EKS_CLUSTER_NAME: string;
  CHART_MAP: MapCollection;
  DOMAIN: String;
  AWS_CERTIFICATE_ARN: string;
  KEYCLOAK_LOADBALANCER: loadbalancer;
  OIDC_LOADBALANCER: loadbalancer;

};

// configuration values 
export const getConfig = (): ConfigProps => ({
  REGION: process.env.REGION || "ap-south-1",
  ACCOUNT: process.env.ACCOUNT || "",
  CIDR: process.env.CIDR || "",
  MAX_AZS: Number(process.env.MAZ_AZs) || 2,
  CHART: "esignet_charts",
  REPOSITORY: "https://dpgonaws.github.io/dpg-helm",
  NAMESPACE: "esignet",
  RDS_USER: process.env.RDS_USER || "postgres",
  RDS_PASSWORD: process.env.RDS_PASSWORD || "",
  RDS_SEC_GRP_INGRESS: process.env.CIDR || "",
 // ROLE_ARN: process.env.ROLE_ARN || "",
  EKS_CLUSTER_NAME: process.env.EKS_CLUSTER_NAME || "ekscluster-esignet-demo",
  CHART_MAP: {
    softhsm : { chartName: "softhsm", namespace: "softhsm" },
    artifactory : { chartName: "artifactory", namespace: "artifactory" },
    kafka : { chartName: "kafka", namespace: "kafka" },
    kafkaUI : { chartName: "kafka-ui", namespace: "kafka" },
    keycloak : { chartName: "keycloak", namespace: "keycloak" },
    keycloakInit : { chartName: "keycloak-init", namespace: "keycloak" },
    postgresInit : { chartName: "postgres-init", namespace: "esignet" },
    esignetBootstrap : { chartName: "esignet-preinit", namespace: "esignet" },
    esignetInit : { chartName: "esignet-init", namespace: "esignet" },
    esignet : { chartName: "esignet", namespace: "esignet" },
    oidcUI : { chartName: "oidc-ui", namespace: "esignet" }
  },
  DOMAIN: process.env.DOMAIN || "",

  AWS_CERTIFICATE_ARN: process.env.CERTIFICATE_ARN || "arn:aws:acm:ap-south-1:370803901956:certificate/6064b56f-1367-4dc4-9a42-290bd724479a",
  KEYCLOAK_LOADBALANCER: {
    name: process.env.LOADBALANCER_NAME || "keycloak-alb-demo",
    domain: "iamesignet." +  process.env.DOMAIN || "sandbox.demodpgs.net"
  },
  OIDC_LOADBALANCER: {
    name: process.env.LOADBALANCER_NAME || "esignet-alb-demo",
    domain: "oidc." +  process.env.DOMAIN || "sandbox.demodpgs.net"
  }
});
