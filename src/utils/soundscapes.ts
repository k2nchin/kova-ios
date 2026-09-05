// Procedural Ambient Sound Generator using Web Audio API (Zero external assets needed)

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private currentMode: string | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.1);
    }
  }

  public stop() {
    if (!this.ctx) return;
    this.activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        window.clearInterval(node);
        return;
      }
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        if ('disconnect' in node) {
          node.disconnect();
        }
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];
    this.currentMode = null;
  }

  public play(mode: 'cyber_rain' | 'cosmic_drone' | 'lofi_pulse' | 'binaural_focus') {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    if (this.currentMode === mode) {
      this.stop();
      return;
    }

    this.stop();
    this.currentMode = mode;

    if (mode === 'cyber_rain') {
      // Pink/Brown noise + bandpass filter for rain & cyber thunder simulation
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const rainGain = this.ctx.createGain();
      rainGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(rainGain);
      rainGain.connect(this.masterGain);

      whiteNoise.start();
      this.activeNodes.push(whiteNoise, filter, rainGain);
    } else if (mode === 'cosmic_drone') {
      // Lush multi-oscillator cosmic drone (432Hz harmonic space)
      const freqs = [108, 162, 216, 324];
      freqs.forEach((f) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);

        // Slow LFO modulation for cosmic drift
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.1 + Math.random() * 0.05, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(4, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        lfo.start();
        this.activeNodes.push(osc, gain, lfo, lfoGain);
      });
    } else if (mode === 'lofi_pulse') {
      // Sub-bass warm drone + rhythmic gentle filtered noise
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      this.activeNodes.push(osc, gain);
    } else if (mode === 'binaural_focus') {
      // 200Hz Left + 214Hz Right = 14Hz Beta Wave (Focus & Flow State)
      const merger = this.ctx.createChannelMerger(2);
      
      const oscL = this.ctx.createOscillator();
      oscL.frequency.setValueAtTime(200, this.ctx.currentTime);
      const gainL = this.ctx.createGain();
      gainL.gain.setValueAtTime(0.15, this.ctx.currentTime);
      oscL.connect(gainL);
      gainL.connect(merger, 0, 0);

      const oscR = this.ctx.createOscillator();
      oscR.frequency.setValueAtTime(214, this.ctx.currentTime);
      const gainR = this.ctx.createGain();
      gainR.gain.setValueAtTime(0.15, this.ctx.currentTime);
      oscR.connect(gainR);
      gainR.connect(merger, 0, 1);

      merger.connect(this.masterGain);
      oscL.start();
      oscR.start();
      this.activeNodes.push(oscL, oscR, gainL, gainR, merger);
    }
  }

  public getActiveMode() {
    return this.currentMode;
  }
}

export const soundscapes = new SoundscapeEngine();
