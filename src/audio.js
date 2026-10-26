// Synthesized Web Audio engine - 100% standalone, zero external mp3/wav files required!
// Realistic Diwali cracker acoustics: Rocket whistle, Anar fountain roar, Chakri whir, Ladi staccato pops, and Laxmi Bomb dhamaka.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.sizzleNode = null;
    this.sizzleGain = null;

    // Active continuous sound nodes
    this.activeFountainNodes = null;
    this.activeChakriNodes = null;
    this.activeRocketNodes = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAllContinuous();
    }
    return this.isMuted;
  }

  stopAllContinuous() {
    this.stopSizzle();
    this.stopAnarFountain();
    this.stopChakriSpin();
    this.stopRocketAscent();
  }

  playWhoosh(intensity = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(750, now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      filter.Q.value = 2.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08 * Math.min(intensity, 1.5), now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.16);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // ==========================================
  // 1. FUSE SIZZLE
  // ==========================================
  startSizzle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    if (this.sizzleNode) {
      this.stopSizzle();
    }

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const pop = Math.random() > 0.95 ? (Math.random() * 2 - 1) * 2.2 : (Math.random() * 2 - 1) * 0.4;
        data[i] = pop;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2400, now);

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(4500, now);
      bandpass.Q.value = 3.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.15);

      noise.connect(filter);
      filter.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      this.sizzleNode = noise;
      this.sizzleGain = gain;
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  stopSizzle() {
    if (this.sizzleGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.sizzleGain.gain.setValueAtTime(this.sizzleGain.gain.value, now);
        this.sizzleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        setTimeout(() => {
          if (this.sizzleNode) {
            try { this.sizzleNode.stop(); } catch(e){}
            try { this.sizzleNode.disconnect(); } catch(e){}
            this.sizzleNode = null;
          }
          this.sizzleGain = null;
        }, 90);
      } catch (e) {
        this.sizzleNode = null;
        this.sizzleGain = null;
      }
    }
  }

  // ==========================================
  // 2. ROCKET ASCENT & SCREAMING WHISTLE
  // ==========================================
  playRocketAscent(duration = 1.0) {
    this.stopSizzle();
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Initial booster ignition "THUMP/WHOOSH"
      const puffBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.18), this.ctx.sampleRate);
      const pData = puffBuffer.getChannelData(0);
      for (let i = 0; i < pData.length; i++) {
        pData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
      }
      const puffNoise = this.ctx.createBufferSource();
      puffNoise.buffer = puffBuffer;
      const puffFilter = this.ctx.createBiquadFilter();
      puffFilter.type = 'lowpass';
      puffFilter.frequency.setValueAtTime(800, now);
      const puffGain = this.ctx.createGain();
      puffGain.gain.setValueAtTime(0.6, now);
      puffGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      puffNoise.connect(puffFilter);
      puffFilter.connect(puffGain);
      puffGain.connect(this.ctx.destination);
      puffNoise.start(now);

      // 2. Screaming ascending whistle (Sine swept 320Hz -> 2100Hz with vibrato)
      const whistleOsc = this.ctx.createOscillator();
      whistleOsc.type = 'sawtooth';
      whistleOsc.frequency.setValueAtTime(340, now);
      whistleOsc.frequency.exponentialRampToValueAtTime(2350, now + duration);

      const whistleFilter = this.ctx.createBiquadFilter();
      whistleFilter.type = 'bandpass';
      whistleFilter.frequency.setValueAtTime(360, now);
      whistleFilter.frequency.exponentialRampToValueAtTime(2350, now + duration);
      whistleFilter.Q.value = 5.0;

      const whistleGain = this.ctx.createGain();
      whistleGain.gain.setValueAtTime(0.01, now);
      whistleGain.gain.linearRampToValueAtTime(0.35, now + 0.15);
      whistleGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.05);

      whistleOsc.connect(whistleFilter);
      whistleFilter.connect(whistleGain);
      whistleGain.connect(this.ctx.destination);

      whistleOsc.start(now);
      whistleOsc.stop(now + duration + 0.08);

      // 3. Thrust jet noise (Roaring exhaust hiss)
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * (duration + 0.2)), this.ctx.sampleRate);
      const nData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < nData.length; i++) {
        nData[i] = Math.random() * 2 - 1;
      }
      const thrustNoise = this.ctx.createBufferSource();
      thrustNoise.buffer = noiseBuffer;

      const thrustFilter = this.ctx.createBiquadFilter();
      thrustFilter.type = 'bandpass';
      thrustFilter.frequency.setValueAtTime(700, now);
      thrustFilter.frequency.exponentialRampToValueAtTime(2400, now + duration);
      thrustFilter.Q.value = 1.8;

      const thrustGain = this.ctx.createGain();
      thrustGain.gain.setValueAtTime(0.05, now);
      thrustGain.gain.linearRampToValueAtTime(0.4, now + 0.2);
      thrustGain.gain.setValueAtTime(0.35, now + duration * 0.8);
      thrustGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      thrustNoise.connect(thrustFilter);
      thrustFilter.connect(thrustGain);
      thrustGain.connect(this.ctx.destination);

      thrustNoise.start(now);
      thrustNoise.stop(now + duration + 0.05);

      this.activeRocketNodes = { whistleOsc, thrustNoise, whistleGain, thrustGain };
    } catch (e) {
      console.warn("Rocket audio error:", e);
    }
  }

  stopRocketAscent() {
    if (this.activeRocketNodes) {
      try {
        if (this.activeRocketNodes.whistleOsc) this.activeRocketNodes.whistleOsc.stop();
        if (this.activeRocketNodes.thrustNoise) this.activeRocketNodes.thrustNoise.stop();
      } catch (e) {}
      this.activeRocketNodes = null;
    }
  }

  // ==========================================
  // 3. ANAR / FLOWERPOT ROARING FOUNTAIN
  // ==========================================
  startAnarFountain() {
    this.stopSizzle();
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.stopAnarFountain();

    try {
      const now = this.ctx.currentTime;
      const bufferLength = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferLength, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) {
        // High density volcanic crackle
        const isSpurt = Math.random() > 0.94;
        data[i] = isSpurt ? (Math.random() * 2 - 1) * 1.8 : (Math.random() * 2 - 1) * 0.45;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Bandpass roar
      const roarFilter = this.ctx.createBiquadFilter();
      roarFilter.type = 'bandpass';
      roarFilter.frequency.setValueAtTime(1400, now);
      roarFilter.Q.value = 1.2;

      // High sparkling sizzle
      const sizzleFilter = this.ctx.createBiquadFilter();
      sizzleFilter.type = 'highpass';
      sizzleFilter.frequency.setValueAtTime(3200, now);

      const fountainGain = this.ctx.createGain();
      // Crescendo from soft to powerful volcanic shower
      fountainGain.gain.setValueAtTime(0.01, now);
      fountainGain.gain.linearRampToValueAtTime(0.48, now + 0.6);

      noise.connect(roarFilter);
      noise.connect(sizzleFilter);
      roarFilter.connect(fountainGain);
      sizzleFilter.connect(fountainGain);
      fountainGain.connect(this.ctx.destination);

      // Low hollow rumble inside the cone
      const rumbleOsc = this.ctx.createOscillator();
      rumbleOsc.type = 'triangle';
      rumbleOsc.frequency.setValueAtTime(95, now);
      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.01, now);
      rumbleGain.gain.linearRampToValueAtTime(0.2, now + 0.4);
      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);

      noise.start(now);
      rumbleOsc.start(now);

      this.activeFountainNodes = { noise, rumbleOsc, fountainGain, rumbleGain };
    } catch (e) {
      console.warn("Anar audio error:", e);
    }
  }

  stopAnarFountain() {
    if (this.activeFountainNodes && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.activeFountainNodes.fountainGain.gain.setValueAtTime(this.activeFountainNodes.fountainGain.gain.value, now);
        this.activeFountainNodes.fountainGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        this.activeFountainNodes.rumbleGain.gain.setValueAtTime(this.activeFountainNodes.rumbleGain.gain.value, now);
        this.activeFountainNodes.rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        const nodes = this.activeFountainNodes;
        setTimeout(() => {
          try { nodes.noise.stop(); nodes.noise.disconnect(); } catch (e) {}
          try { nodes.rumbleOsc.stop(); nodes.rumbleOsc.disconnect(); } catch (e) {}
        }, 160);
      } catch (e) {}
      this.activeFountainNodes = null;
    }
  }

  // ==========================================
  // 4. CHAKRI / GROUND SPINNER WHIR
  // ==========================================
  startChakriSpin() {
    this.stopSizzle();
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.stopChakriSpin();

    try {
      const now = this.ctx.currentTime;

      // Whirring oscillator with speed-up vibrato
      const whirOsc = this.ctx.createOscillator();
      whirOsc.type = 'triangle';
      whirOsc.frequency.setValueAtTime(260, now);
      whirOsc.frequency.linearRampToValueAtTime(620, now + 0.8);

      // Low frequency modulation (LFO) for the spinning rotor pulse
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(6, now);
      lfo.frequency.linearRampToValueAtTime(26, now + 1.2);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 60;
      lfo.connect(whirOsc.frequency);

      // Noise component for spinning flame jets
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 3, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1600, now);
      noiseFilter.frequency.linearRampToValueAtTime(3200, now + 0.8);
      noiseFilter.Q.value = 2.0;

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.linearRampToValueAtTime(0.35, now + 0.3);

      whirOsc.connect(masterGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      whirOsc.start(now);
      lfo.start(now);
      noise.start(now);

      this.activeChakriNodes = { whirOsc, lfo, noise, masterGain };
    } catch (e) {
      console.warn("Chakri audio error:", e);
    }
  }

  stopChakriSpin() {
    if (this.activeChakriNodes && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.activeChakriNodes.masterGain.gain.setValueAtTime(this.activeChakriNodes.masterGain.gain.value, now);
        this.activeChakriNodes.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        const nodes = this.activeChakriNodes;
        setTimeout(() => {
          try { nodes.whirOsc.stop(); nodes.whirOsc.disconnect(); } catch (e) {}
          try { nodes.lfo.stop(); nodes.lfo.disconnect(); } catch (e) {}
          try { nodes.noise.stop(); nodes.noise.disconnect(); } catch (e) {}
        }, 130);
      } catch (e) {}
      this.activeChakriNodes = null;
    }
  }

  // ==========================================
  // 5. LADI RAPID STACCATO MINI-POPS
  // ==========================================
  playMiniPop(pan = 0, volumeScale = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Sharp snap
      const snapOsc = this.ctx.createOscillator();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(2800 + Math.random() * 800, now);
      snapOsc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      const snapGain = this.ctx.createGain();
      snapGain.gain.setValueAtTime(0.4 * volumeScale, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.05);

      // Body pop
      const bodyOsc = this.ctx.createOscillator();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(220 + Math.random() * 50, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      const bodyGain = this.ctx.createGain();
      bodyGain.gain.setValueAtTime(0.5 * volumeScale, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(this.ctx.destination);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.1);

      // Noise crackle puff
      const bufSize = Math.floor(this.ctx.sampleRate * 0.06);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.35 * volumeScale, now);
      nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  // ==========================================
  // 6. SKY EXPLOSION (ROCKET DETONATION)
  // ==========================================
  playSkyExplosion() {
    this.stopSizzle();
    this.stopRocketAscent();
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // High sharp airburst crack
      const crackOsc = this.ctx.createOscillator();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.setValueAtTime(950, now);
      crackOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      const crackGain = this.ctx.createGain();
      crackGain.gain.setValueAtTime(0.7, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      crackOsc.connect(crackGain);
      crackGain.connect(this.ctx.destination);
      crackOsc.start(now);
      crackOsc.stop(now + 0.2);

      // Heavy distant thunder roll
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now + 0.04);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 1.2);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.85, now + 0.04);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now + 0.04);
      subOsc.stop(now + 1.6);

      // Sparkling shower decay
      const bSize = Math.floor(this.ctx.sampleRate * 1.2);
      const buffer = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 1.2);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.8, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);

      setTimeout(() => this.playDebrisCrackle(), 180);
    } catch (e) {
      console.warn("Sky explosion error:", e);
    }
  }

  // ==========================================
  // 7. LAXMI BOMB / GENERAL GROUND EXPLOSION
  // ==========================================
  playExplosion(isBomb = true) {
    this.stopSizzle();
    this.stopAllContinuous();
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Visceral sub-bass ground shock
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(isBomb ? 210 : 170, now);
      subOsc.frequency.exponentialRampToValueAtTime(24, now + (isBomb ? 1.0 : 0.7));

      subGain.gain.setValueAtTime(isBomb ? 1.0 : 0.8, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + (isBomb ? 1.4 : 1.0));

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.5);

      // 2. High-impact mid punch & clipping snap
      const midOsc = this.ctx.createOscillator();
      const midGain = this.ctx.createGain();
      midOsc.type = 'triangle';
      midOsc.frequency.setValueAtTime(320, now);
      midOsc.frequency.exponentialRampToValueAtTime(40, now + 0.45);

      midGain.gain.setValueAtTime(isBomb ? 0.85 : 0.65, now);
      midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      midOsc.connect(midGain);
      midGain.connect(this.ctx.destination);
      midOsc.start(now);
      midOsc.stop(now + 0.52);

      // 3. Deafening blast noise wave
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.28));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3600, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 1.2);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(1.0, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 1.5);

      // 4. Lingering crackle debris
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playDebrisCrackle();
      }, 150);

    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playDebrisCrackle() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.8);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        if (Math.random() > 0.985) {
          data[i] = (Math.random() * 2 - 1) * 0.8;
        } else {
          data[i] = 0;
        }
      }
      const crackle = this.ctx.createBufferSource();
      crackle.buffer = buffer;
      const cGain = this.ctx.createGain();
      cGain.gain.setValueAtTime(0.4, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      crackle.connect(cGain);
      cGain.connect(this.ctx.destination);
      crackle.start(now);
    } catch (e) {}
  }

  playFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.2 },
        { freq: 659.25, time: 0.18, dur: 0.2 },
        { freq: 783.99, time: 0.36, dur: 0.25 },
        { freq: 1046.50, time: 0.58, dur: 0.8 },
      ];

      const now = this.ctx.currentTime + 0.2;

      notes.forEach(({ freq, time, dur }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.linearRampToValueAtTime(0.25, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playSparkle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [1318.51, 1661.22, 1975.53, 2637.02, 3135.96]; // E6, G#6, B6, E7, G7
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (e) {}
  }
}

export const soundEngine = new SoundEngine();
