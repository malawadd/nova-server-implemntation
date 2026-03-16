const TARGET_SAMPLE_RATE = 16_000;

function arrayBufferToBase64(buffer: ArrayBufferLike) {
  const bytes = new Uint8Array(buffer);
  const chars = new Array(bytes.byteLength);

  for (let index = 0; index < bytes.byteLength; index += 1) {
    chars[index] = String.fromCharCode(bytes[index]);
  }

  return window.btoa(chars.join(""));
}

export class NovaAudioCapture {
  private audioContext: AudioContext | null = null;

  private audioStream: MediaStream | null = null;

  private processor: ScriptProcessorNode | null = null;

  private sourceNode: MediaStreamAudioSourceNode | null = null;

  private samplingRatio = 1;

  private readonly isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

  async prepare() {
    if (this.audioStream && this.audioContext) {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      return;
    }

    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.audioContext = this.isFirefox
      ? new AudioContext()
      : new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });

    this.samplingRatio = this.audioContext.sampleRate / TARGET_SAMPLE_RATE;
  }

  async start(onChunk: (base64Chunk: string) => void) {
    await this.prepare();

    if (!this.audioContext || !this.audioStream) {
      throw new Error("Microphone is not ready");
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.stop();

    this.sourceNode = this.audioContext.createMediaStreamSource(this.audioStream);
    this.processor = this.audioContext.createScriptProcessor(512, 1, 1);

    this.processor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const targetLength = this.isFirefox
        ? Math.max(1, Math.round(inputData.length / this.samplingRatio))
        : inputData.length;

      const pcmData = new Int16Array(targetLength);

      if (this.isFirefox) {
        for (let index = 0; index < targetLength; index += 1) {
          const sourceIndex = Math.min(
            inputData.length - 1,
            Math.floor(index * this.samplingRatio),
          );
          pcmData[index] = Math.max(-1, Math.min(1, inputData[sourceIndex])) * 0x7fff;
        }
      } else {
        for (let index = 0; index < inputData.length; index += 1) {
          pcmData[index] = Math.max(-1, Math.min(1, inputData[index])) * 0x7fff;
        }
      }

      onChunk(arrayBufferToBase64(pcmData.buffer));
    };

    this.sourceNode.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop() {
    this.processor?.disconnect();
    this.sourceNode?.disconnect();
    this.processor = null;
    this.sourceNode = null;
  }

  async dispose() {
    this.stop();

    this.audioStream?.getTracks().forEach((track) => track.stop());
    this.audioStream = null;

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}
