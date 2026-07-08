export type HealthStatus = {
  service:string;
  status:'healthy'|'degraded';
  checkedAt:string;
};

export function getHealthStatus():HealthStatus[]{
 return [{service:'TaskForge API',status:'healthy',checkedAt:new Date().toISOString()}];
}
