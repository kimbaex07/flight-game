// All sound is synthesised with WebAudio: engine hum, wind, chimes.
// No audio files, no network. Created lazily on the first player gesture.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineGain = null;
    this.engineOsc = null;
    this.windGain = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    // Engine: a sawtooth hum whose pitch follows the throttle.
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 55;
    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 320;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineOsc.connect(engineFilter).connect(this.engineGain).connect(this.ctx.destination);
    this.engineOsc.start();
    // Wind: looped noise through a bandpass, louder with speed.
    const len = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 700;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    noise.connect(windFilter).connect(this.windGain).connect(this.ctx.destination);
    noise.start();
  }

  setFlight(throttle, speedKmh, flying) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(48 + throttle * 70, t, 0.1);
    this.engineGain.gain.setTargetAtTime(flying ? 0.03 + throttle * 0.05 : 0, t, 0.15);
    this.windGain.gain.setTargetAtTime(flying ? Math.min(0.09, speedKmh / 2400) : 0, t, 0.2);
  }

  tone(freq, start, dur, type = 'sine', vol = 0.16) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    const t0 = this.ctx.currentTime + start;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  ring() {
    this.tone(880, 0, 0.35);
    this.tone(1318, 0.09, 0.4);
  }

  miss() {
    this.tone(220, 0, 0.3, 'triangle', 0.12);
    this.tone(165, 0.12, 0.4, 'triangle', 0.12);
  }

  landed() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, i * 0.13, 0.4));
  }

  crashed() {
    this.tone(70, 0, 0.6, 'sawtooth', 0.2);
    this.tone(50, 0.05, 0.7, 'square', 0.12);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.engineGain.gain.setTargetAtTime(0, t, 0.05);
      this.windGain.gain.setTargetAtTime(0, t, 0.05);
    }
    return this.muted;
  }
}
