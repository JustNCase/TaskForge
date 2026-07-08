export function validateBody(required: string[]) {
  return (req: any, res: any, next: any) => {
    const missing = required.filter((key) => !req.body?.[key]);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
    next();
  };
}
