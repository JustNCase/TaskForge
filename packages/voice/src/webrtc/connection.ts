export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  audioConstraints?: MediaStreamConstraints;
}

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export class WebRTCConnection {
  private config: WebRTCConfig;

  constructor(config: WebRTCConfig = {}) {
    this.config = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      audioConstraints: { audio: true, video: false },
      ...config,
    };
  }

  async createOffer(): Promise<string> {
    return JSON.stringify({ type: "offer", sdp: "pending" });
  }

  async handleAnswer(_answer: string): Promise<void> {}

  async addIceCandidate(_candidate: string): Promise<void> {}

  close(): void {}
}
