const { spawn } = require("child_process");
const path = require("path");

process.env.OPENAI_API_KEY = "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";

const services = [
  { name: "API", cmd: "npx", args: ["tsx", "services/api/src/index.ts"], port: 3001 },
  { name: "Voice", cmd: "npx", args: ["tsx", "services/voice/src/index.ts"], port: 3002 },
  { name: "AI", cmd: "npx", args: ["tsx", "services/ai/src/index.ts"], port: 3003 },
  { name: "Web", cmd: "npx", args: ["next", "dev", "apps/web", "--port", "3000"], port: 3000 },
];

services.forEach((svc) => {
  const proc = spawn(svc.cmd, svc.args, {
    stdio: "pipe",
    cwd: __dirname,
    env: { ...process.env },
  });
  proc.stdout.on("data", (d) => console.log(`[${svc.name}] ${d}`));
  proc.stderr.on("data", (d) => console.error(`[${svc.name}] ${d}`));
  proc.on("exit", (code) => console.log(`[${svc.name}] exited with code ${code}`));
  console.log(`[${svc.name}] starting on port ${svc.port}...`);
});

setTimeout(() => {
  console.log("\nAll services started. Press Ctrl+C to stop.");
}, 3000);
