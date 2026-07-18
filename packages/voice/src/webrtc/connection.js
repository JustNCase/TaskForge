export class WebRTCConnection {
    config;
    constructor(config = {}) {
        this.config = {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            audioConstraints: { audio: true, video: false },
            ...config,
        };
    }
    async createOffer() {
        return JSON.stringify({ type: "offer", sdp: "pending" });
    }
    async handleAnswer(_answer) { }
    async addIceCandidate(_candidate) { }
    close() { }
}
//# sourceMappingURL=connection.js.map