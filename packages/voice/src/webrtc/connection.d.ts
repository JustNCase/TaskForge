export interface WebRTCConfig {
    iceServers?: RTCIceServer[];
    audioConstraints?: MediaStreamConstraints;
}
export interface RTCIceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}
export declare class WebRTCConnection {
    private config;
    constructor(config?: WebRTCConfig);
    createOffer(): Promise<string>;
    handleAnswer(_answer: string): Promise<void>;
    addIceCandidate(_candidate: string): Promise<void>;
    close(): void;
}
//# sourceMappingURL=connection.d.ts.map