// Kova Web Audio Sound Synthesis Engine (Zero external MP3 dependencies, ultra-fast & lightweight)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private masterVolume = 1;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // All voices route through a single master gain so volume is a real,
  // globally-applied control instead of a per-sound constant.
  private getOutput(ctx: AudioContext): AudioNode {
    if (!this.masterGain || this.masterGain.context !== ctx) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // 1. Message Sent Sound (soft gentle pop)
  public playMessageSent() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.getOutput(ctx));

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // 2. Join Voice Room (Futuristic Harmonic Cyber Chime)
  public playJoinVoice() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.25);
    });
  }

  // 3. Leave Voice Room (Soft downward sweep)
  public playLeaveVoice() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.getOutput(ctx));

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // 4. Mute / Unmute Toggle Beep
  // Two short notes: falling when you mute, rising when you unmute.
  // The style is chosen per device in Ajustes → Voz.
  public playMuteToggle(muted: boolean) {
    if (!this.soundEnabled) return;
    let style = 'clic';
    try { style = localStorage.getItem('kova.voice.muteSound') || 'clic'; } catch {}
    if (style === 'ninguno') return;
    const ctx = this.getContext();
    if (!ctx) return;
    const soft = style === 'suave';
    const notes = muted ? [660, 440] : [440, 660];
    notes.forEach((freq, index) => {
      const at = ctx.currentTime + index * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = soft ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(soft ? 0.09 : 0.16, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(at);
      osc.stop(at + 0.1);
    });
  }

  // Deafen uses a lower pair so it's distinguishable from mute.
  public playDeafenToggle(deafened: boolean) {
    if (!this.soundEnabled) return;
    let style = 'clic';
    try { style = localStorage.getItem('kova.voice.muteSound') || 'clic'; } catch {}
    if (style === 'ninguno') return;
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = deafened ? [392, 262] : [262, 392];
    notes.forEach((freq, index) => {
      const at = ctx.currentTime + index * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.14, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(at);
      osc.stop(at + 0.13);
    });
  }

  // 5. AI Sparkle Chime
  public playAISparkle() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const freqs = [880, 1174.66, 1396.91, 1760];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);

      gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.2);

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));

      osc.start(ctx.currentTime + idx * 0.04);
      osc.stop(ctx.currentTime + idx * 0.04 + 0.2);
    });
  }

  // 6. Soundboard Effects
  public playSoundboardFx(
    type: 'laser' | 'victory' | 'cyberhorn' | 'arcade' | 'airhorn' | 'quack' | 'applause' | 'badumtss' | 'kova_ping' | 'bruh'
  ) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (type === 'laser') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'victory') {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.getOutput(ctx));
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    } else if (type === 'arcade') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.06);
      osc.frequency.setValueAtTime(900, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'cyberhorn') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'airhorn') {
      // Classic multi-burst brass horn
      [0, 0.12, 0.25, 0.38].forEach((offset) => {
        [466.16, 587.33, 700].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18);
          osc.connect(gain);
          gain.connect(this.getOutput(ctx));
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.18);
        });
      });
    } else if (type === 'quack') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'applause') {
      // Noise burst cluster for clapping
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150 + Math.random() * 500, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.08);
        osc.connect(gain);
        gain.connect(this.getOutput(ctx));
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.08);
      }
    } else if (type === 'badumtss') {
      // Ba-Dum-Tss
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(180, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.getOutput(ctx));
      osc1.start();
      osc1.stop(ctx.currentTime + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.getOutput(ctx));
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.28);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'square';
      osc3.frequency.setValueAtTime(3200, ctx.currentTime + 0.32);
      gain3.gain.setValueAtTime(0.1, ctx.currentTime + 0.32);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc3.connect(gain3);
      gain3.connect(this.getOutput(ctx));
      osc3.start(ctx.currentTime + 0.32);
      osc3.stop(ctx.currentTime + 0.6);
    } else if (type === 'kova_ping') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'bruh') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(85, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.16, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  }

  // 7. Reaction Added (sparkling chime)
  // Reaction sounds: each emoji has its own tiny, synthesized sound (no files to download).
  private tone(ctx: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.08, toFreq?: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, ctx.currentTime + start + dur);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(this.getOutput(ctx));
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.02);
  }

  private noise(ctx: AudioContext, start: number, dur: number, from: number, to: number, vol = 0.06) {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(from, ctx.currentTime + start);
    filter.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + start + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    src.connect(filter); filter.connect(gain); gain.connect(this.getOutput(ctx));
    src.start(ctx.currentTime + start);
  }

  public playReactionSound(emoji: string) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const e = emoji.replace(/\uFE0F/g, '');
    switch (e) {
      case '❤': case '😍': case '🥰': // warm two-note chime
        this.tone(ctx, 659.25, 0, 0.35, 'sine', 0.07); this.tone(ctx, 987.77, 0.09, 0.45, 'sine', 0.06); break;
      case '😂': case '🤣': case '😆': // bouncy "ha-ha-ha"
        [0, 0.09, 0.18, 0.27].forEach((t, i) => this.tone(ctx, 520 + i * 40, t, 0.08, 'triangle', 0.07, 380 + i * 30)); break;
      case '🔥': // whoosh
        this.noise(ctx, 0, 0.45, 300, 3200, 0.09); this.tone(ctx, 110, 0, 0.35, 'sawtooth', 0.025, 220); break;
      case '👍': case '👌': // pop
        this.tone(ctx, 300, 0, 0.09, 'sine', 0.12, 900); break;
      case '😮': case '😯': case '🤯': // rising "ooh"
        this.tone(ctx, 330, 0, 0.4, 'sine', 0.07, 660); break;
      case '😢': case '😭': // sad slide down
        this.tone(ctx, 494, 0, 0.25, 'triangle', 0.06, 440); this.tone(ctx, 440, 0.22, 0.45, 'triangle', 0.06, 330); break;
      case '🙏': // soft bell
        this.tone(ctx, 1046.5, 0, 0.8, 'sine', 0.05); this.tone(ctx, 2093, 0, 0.5, 'sine', 0.015); break;
      case '👏': this.playSoundboardFx('applause'); break;
      case '🎉': case '🥳': this.playSoundboardFx('victory'); break;
      case '🚀': case '⚡': this.playSoundboardFx('laser'); break;
      case '💀': this.playSoundboardFx('bruh'); break;
      case '🦆': this.playSoundboardFx('quack'); break;
      case '🥁': this.playSoundboardFx('badumtss'); break;
      default: this.playReactionAdded();
    }
  }

  public playReactionAdded() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.1); // D6

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.getOutput(ctx));

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // 8. Spatial Ping (Radar de Voz) — stereo-panned blip from a normalized position.
  // x: -100 (izquierda) .. 100 (derecha) · y: -100 (arriba) .. 100 (abajo)
  public playSpatialPing(x: number, y: number) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, x / 100));

    // Distance from listener (center) attenuates volume: center = 1.0, edge = 0.55
    const distance = Math.min(1, Math.sqrt(x * x + y * y) / 100);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14 * (1 - distance * 0.45), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // Farther voices sound slightly deeper (doppler-style cue)
    osc.frequency.setValueAtTime(880 - distance * 180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.getOutput(ctx));

    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  }
}

export const soundFx = new SoundEngine();
