import OpenAI from "openai";
export class SceneAnalyzer {
    client;
    model;
    constructor(apiKey, model = "gpt-4o-mini") {
        this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
        this.model = model;
    }
    async analyze(imageBase64) {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: `You are a scene understanding system. Analyze the image and return JSON describing the scene.
Include: sceneType (indoor/outdoor/office/home/etc), description, confidence (0-1), lighting, environment, activities (array), objects present (array).
Format: {"sceneType": "office", "description": "Modern open-plan office with desks", "confidence": 0.92, "lighting": "artificial bright", "environment": "indoor", "activities": ["working", "meeting"], "objects": ["desk", "chair", "computer", "monitor"]}.
Return ONLY valid JSON, no other text.`,
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Describe the scene in this image." },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" } },
                    ],
                },
            ],
            temperature: 0.2,
            max_tokens: 500,
            response_format: { type: "json_object" },
        });
        const content = response.choices[0]?.message?.content || "{}";
        return JSON.parse(content);
    }
}
//# sourceMappingURL=scenes.js.map