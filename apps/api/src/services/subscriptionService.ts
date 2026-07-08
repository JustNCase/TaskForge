export type Subscription={userId:string;plan:string;status:string};
export async function createSubscription(userId:string,plan:string):Promise<Subscription>{return {userId,plan,status:'active'};}
export async function getSubscription(userId:string){return {userId,status:'active'};}
