import { createServer, IncomingMessage, ServerResponse } from "http";
import { ObjectDetector, FaceDetector, SceneAnalyzer, GestureRecognizer } from "@taskforge/vision";
import {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createCorsMiddleware,
  sendJSON,
  readBody,
} from "@taskforge/middleware";

const PORT = parseInt(process.env.VISION_PORT || "3005");

const objectDetector = new ObjectDetector();
const faceDetector = new FaceDetector();
const sceneAnalyzer = new SceneAnalyzer();
const gestureRecognizer = new GestureRecognizer();

const auth = createAuthMiddleware({ publicRoutes: ["/health"] });
const rateLimit = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 30 });
const cors = createCorsMiddleware();

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

const routes: Record<string, Record<string, (req: IncomingMessage, res: ServerResponse) => Promise<void>>> = {
  "/detect/objects": { POST: handleDetectObjects },
  "/detect/faces": { POST: handleDetectFaces },
  "/analyze/scene": { POST: handleAnalyzeScene },
  "/recognize/gestures": { POST: handleRecognizeGestures },
};

const server = createServer(async (req, res) => {
  cors(req, res, () => {
    if (req.method === "OPTIONS") return;

    if (req.url === "/health") {
      return sendJSON(res, 200, { status: "ok", service: "genesis-vision" });
    }

    auth(req, res, () => {
      rateLimit(req, res, async () => {
        try {
          const path = req.url?.split("?")[0] || "";
          const handler = routes[path]?.[req.method || ""];
          if (handler) return await handler(req, res);
        } catch (err: any) {
          console.error(`[genesis:vision] Error on ${req.url}:`, err?.message);
          return sendJSON(res, 500, { error: err?.message || "Internal error" });
        }

        sendJSON(res, 404, { error: "Not found" });
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`[genesis:vision] Ready at http://localhost:${PORT}`);
  console.log(`[genesis:vision] Endpoints: POST /detect/objects, /detect/faces, /analyze/scene, /recognize/gestures`);
});
