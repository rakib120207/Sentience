// audio-processor.js — AudioWorklet processor for Sentience
// Runs in a dedicated audio thread (no main-thread blocking)
// 512-frame chunks = 32ms latency at 16kHz — minimum viable for live conversation

class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(512);
    this._filled  = 0;
    this._rmsSum  = 0;  // accumulated for VU meter
    this._rmsCnt  = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const channel = input[0];

    for (let i = 0; i < channel.length; i++) {
      const s = channel[i];
      this._buffer[this._filled++] = s;
      this._rmsSum += s * s;
      this._rmsCnt++;

      if (this._filled >= 512) {
        const rms = Math.sqrt(this._rmsSum / this._rmsCnt);
        this.port.postMessage({
          pcmFloat32: this._buffer.slice(0),
          rms,                  // send RMS so JS can do echo-gate without recomputing
        });
        this._filled  = 0;
        this._rmsSum  = 0;
        this._rmsCnt  = 0;
      }
    }
    return true;
  }
}

registerProcessor('mic-processor', MicProcessor);
