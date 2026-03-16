class ExpandableBuffer {
  constructor() {
    this.buffer = new Float32Array(24000);
    this.readIndex = 0;
    this.writeIndex = 0;
    this.underflowedSamples = 0;
    this.isInitialBuffering = true;
    this.initialBufferLength = 24000;
  }

  write(samples) {
    if (this.writeIndex + samples.length > this.buffer.length) {
      if (samples.length <= this.readIndex) {
        const subarray = this.buffer.subarray(this.readIndex, this.writeIndex);
        this.buffer.set(subarray);
      } else {
        const newLength = (samples.length + this.writeIndex - this.readIndex) * 2;
        const newBuffer = new Float32Array(newLength);
        newBuffer.set(this.buffer.subarray(this.readIndex, this.writeIndex));
        this.buffer = newBuffer;
      }

      this.writeIndex -= this.readIndex;
      this.readIndex = 0;
    }

    this.buffer.set(samples, this.writeIndex);
    this.writeIndex += samples.length;

    if (this.writeIndex - this.readIndex >= this.initialBufferLength) {
      this.isInitialBuffering = false;
    }
  }

  read(destination) {
    let copyLength = 0;

    if (!this.isInitialBuffering) {
      copyLength = Math.min(destination.length, this.writeIndex - this.readIndex);
    }

    destination.set(this.buffer.subarray(this.readIndex, this.readIndex + copyLength));
    this.readIndex += copyLength;

    if (copyLength < destination.length) {
      destination.fill(0, copyLength);
      this.underflowedSamples += destination.length - copyLength;
    }

    if (copyLength === 0) {
      this.isInitialBuffering = true;
    }
  }

  clearBuffer() {
    this.readIndex = 0;
    this.writeIndex = 0;
  }
}

class AudioPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.playbackBuffer = new ExpandableBuffer();
    this.port.onmessage = (event) => {
      if (event.data.type === "audio") {
        this.playbackBuffer.write(event.data.audioData);
      } else if (event.data.type === "barge-in") {
        this.playbackBuffer.clearBuffer();
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0][0];
    this.playbackBuffer.read(output);
    return true;
  }
}

registerProcessor("audio-player-processor", AudioPlayerProcessor);
