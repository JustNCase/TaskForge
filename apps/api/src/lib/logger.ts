export function logEvent(event: string, data: unknown = {}) { console.log(JSON.stringify({ event, data, time: new Date().toISOString() })); }
