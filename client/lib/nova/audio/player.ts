const WORKLET_URL = "/audio/AudioPlayerProcessor.worklet.js";

function base64ToFloat32Array(base64String: string) {
  const binary = window.atob(base64String);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);

  for (let index = 0; index < int16Array.length; index += 1) {
    float32Array[index] = int16Array[index] / 32_768;
  }

  return float32Array;
}

export class NovaAudioPlayer {
  private audioContext: AudioContext | null = null;

  private workletNode: AudioWorkletNode | null = null;

  initialized = false;

  async start() {
    if (this.initialized && this.audioContext) {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      return;
    }

    this.audioContext = new AudioContext({ sampleRate: 24_000 });
    await this.audioContext.audioWorklet.addModule(WORKLET_URL);
    this.workletNode = new AudioWorkletNode(this.audioContext, "audio-player-processor");
    this.workletNode.connect(this.audioContext.destination);
    this.initialized = true;
  }

  async playBase64(base64Audio: string) {
    if (!base64Audio) return;

    await this.start();
    this.workletNode?.port.postMessage({
      type: "audio",
      audioData: base64ToFloat32Array(base64Audio),
    });
  }

  bargeIn() {
    this.workletNode?.port.postMessage({ type: "barge-in" });
  }

  async stop() {
    this.workletNode?.disconnect();
    this.workletNode = null;

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.initialized = false;
  }
}
