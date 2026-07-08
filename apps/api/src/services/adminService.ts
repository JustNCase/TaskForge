export type AdminMetric={name:string;value:number};

export function getAdminMetrics():AdminMetric[]{
 return [
  {name:'users',value:0},
  {name:'revenue',value:0},
  {name:'tasks',value:0}
 ];
}
