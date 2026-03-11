// audio-processor.js — AudioWorklet processor for Sentience
// Runs in a dedicated audio thread (no main-thread blocking)
// Collects mic samples into 4096-frame chunks and posts them to sidepanel.js

class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(2048);
    this._filled = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];

    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._filled++] = channel[i];

      if (this._filled >= 2048) {
        // Send a copy — the original gets overwritten next frame
        this.port.postMessage({ pcmFloat32: this._buffer.slice(0) }); // 2048-frame chunks = ~128ms latency at 16kHz
        this._filled = 0;
      }
    }
    return true; // keep processor alive
  }
}

registerProcessor('mic-processor', MicProcessor);
