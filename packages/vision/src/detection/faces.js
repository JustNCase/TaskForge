import OpenAI from "openai";
export class FaceDetector {
    client;
    model;
    constructor(apiKey, model = "gpt-4o-mini") {
        this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
        this.model = model;
    }
    async detect(imageBase64) {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: `You are a face detection system. Analyze the image and return a JSON array of detected faces.
For each face provide: faceIndex, confidence (0-1), boundingBox {x, y, width, height}, emotion, emotionConfidence, age range, gender.
Format: [{"faceIndex": 0, "confidence": 0.98, "boundingBox": {"x": 50, "y": 30, "width": 80, "height": 100}, "emotion": "happy", "emotionConfidence": 0.85, "age": "25-35", "gender": "male"}].
Return ONLY valid JSON, no other text. If no faces detected, return [].`,
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Detect all faces in this image and analyze their attributes." },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" } },
                    ],
                },
            ],
            temperature: 0.1,
            max_tokens: 1000,
            response_format: { type: "json_object" },
        });
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : parsed.faces || parsed.detections || [];
    }
}
//# sourceMappingURL=faces.js.map