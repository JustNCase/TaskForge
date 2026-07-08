export type BillingStatus = 'active' | 'paused' | 'cancelled';

export function updateBillingStatus(userId:string,status:BillingStatus){
 return {userId,status,updatedAt:new Date().toISOString()};
}
