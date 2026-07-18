import { createServer, IncomingMessage, ServerResponse } from "http";
import { ObjectDetector, FaceDetector, SceneAnalyzer, GestureRecognizer } from "@taskforge/vision";

const PORT = parseInt(process.env.VISION_PORT || "3005");

const objectDetector = new ObjectDetector();
const faceDetector = new FaceDetector();
const sceneAnalyzer = new SceneAnalyzer();
const gestureRecognizer = new GestureRecognizer();

function sendJSON(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleDetectObjects(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.image) {
    return sendJSON(res, 400, { error: "Missing required field: image (base64)" });
  }
  const objects = await objectDetector.detect(body.image);
  sendJSON(res, 200, { objects, count: objects.length, model: "gpt-4o-mini" });
}

async function handleDetectFaces(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.image) {
    return sendJSON(res, 400, { error: "Missing required field: image (base64)" });
  }
  const faces = await faceDetector.detect(body.image);
  sendJSON(res, 200, { faces, count: faces.length, model: "gpt-4o-mini" });
}

async function handleAnalyzeScene(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.image) {
    return sendJSON(res, 400, { error: "Missing required field: image (base64)" });
  }
  const scene = await sceneAnalyzer.analyze(body.image);
  sendJSON(res, 200, { scene, model: "gpt-4o-mini" });
}

async function handleRecognizeGestures(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.image) {
    return sendJSON(res, 400, { error: "Missing required field: image (base64)" });
  }
  const gestures = await gestureRecognizer.recognize(body.image);
  sendJSON(res, 200, { gestures, count: gestures.length, model: "gpt-4o-mini" });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  if (req.url === "/health") {
    return sendJSON(res, 200, { status: "ok", service: "genesis-vision" });
  }

  try {
    if (req.url === "/detect/objects" && req.method === "POST") return await handleDetectObjects(req, res);
    if (req.url === "/detect/faces" && req.method === "POST") return await handleDetectFaces(req, res);
    if (req.url === "/analyze/scene" && req.method === "POST") return await handleAnalyzeScene(req, res);
    if (req.url === "/recognize/gestures" && req.method === "POST") return await handleRecognizeGestures(req, res);
  } catch (err: any) {
    console.error(`[genesis:vision] Error on ${req.url}:`, err?.message);
    return sendJSON(res, 500, { error: err?.message || "Internal error" });
  }

  sendJSON(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`[genesis:vision] Ready at http://localhost:${PORT}`);
  console.log(`[genesis:vision] Endpoints: POST /detect/objects, /detect/faces, /analyze/scene, /recognize/gestures`);
});
