/* ==========================================================================
   EINMALEINS ARCADE - SYNTHESIZED WEB AUDIO ENGINE
   100% autark, keine externen MP3-Dateien nötig, läuft sofort offline!
   ========================================================================== */

class ArcadeAudio {
  constructor() {
    this.ctx = null;
    this.sfxVolume = 1.0;
    this.musicVolume = 0.35;
    this.muted = false;
    this.musicInterval = null;
    this.musicStep = 0;
    this.isMusicPlaying = false;
  }

  // Audio-Context bei erster Benutzer-Interaktion wecken (Browser-Policy)
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.muted;
  }

  setVolumes(sfx, music) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
  }

  // 1. Klick-Sound für Buttons
  playClick() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.04);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // 2. Belohnender Treffer-Akkord (Chime / Erfolg)
  playCorrect() {
    if (this.muted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Glücklicher Dur-Akkord)
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.045);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, t + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.045 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.045);
      osc.stop(t + idx * 0.045 + 0.35);
    });
  }

  // 3. Ticken bei ablaufendem Timer (Spannung steigt!)
  playTick(urgency = 1) {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = urgency > 1.5 ? 950 : 700;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.035);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // 4. Falsche Antwort / Fehler-Buzz
  playWrong() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(70, t + 0.3);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // 5. Game Over Jingle
  playGameOver() {
    if (this.muted) return;
    this.init();
    const notes = [392.00, 349.23, 311.13, 261.63]; // G4, F4, D#4, C4 (Traurige Melodie)
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.3 * this.sfxVolume, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.35);
    });
  }

  // 6. Highscore Fanfare (Jubel / Rekord)
  playCheer() {
    if (this.muted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.35 * this.sfxVolume, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.45);
    });
  }

  // 6b. Fetter LEVEL-UP Sound (Triumphales Power-Up mit Glissando & Akkord)
  playLevelUp() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    // Aufsteigender Synth-Glide
    const glideOsc = this.ctx.createOscillator();
    const glideGain = this.ctx.createGain();
    glideOsc.type = 'sawtooth';
    glideOsc.frequency.setValueAtTime(220, t);
    glideOsc.frequency.exponentialRampToValueAtTime(880, t + 0.35);

    glideGain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
    glideGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    glideOsc.connect(glideGain);
    glideGain.connect(this.ctx.destination);
    glideOsc.start(t);
    glideOsc.stop(t + 0.38);

    // Kraftvoller Dreiklang-Akkord direkt nach dem Glide
    const chordNotes = [523.25, 659.25, 783.99, 1046.50, 1567.98]; // C-Dur Power Chime
    chordNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + 0.3 + idx * 0.03);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.32 * this.sfxVolume, t + 0.3 + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + idx * 0.03 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + 0.3 + idx * 0.03);
      osc.stop(t + 0.3 + idx * 0.03 + 0.6);
    });
  }

  // 7. Lo-Fi Arcade Synth Beat (synthetische Hintergrundmusik)
  startMusic() {
    if (this.muted || this.isMusicPlaying || this.musicVolume <= 0) return;
    this.init();
    this.isMusicPlaying = true;
    this.musicStep = 0;

    // Harmonische Tonleiter (Pentatonisch für immer gut klingenden Sound)
    const bassScale = [130.81, 146.83, 164.81, 196.00]; // C3, D3, E3, G3
    const leadScale = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5

    const stepDuration = 220; // 136 BPM

    this.musicInterval = setInterval(() => {
      if (!this.isMusicPlaying || this.muted) return;
      const t = this.ctx.currentTime;

      // Basslinie auf jedem 2. Beat
      if (this.musicStep % 2 === 0) {
        const bassFreq = bassScale[Math.floor(this.musicStep / 4) % bassScale.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, t);

        gain.gain.setValueAtTime(0.12 * this.musicVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      }

      // Dezent melodischer Synthi-Tupfer
      if (Math.random() > 0.45) {
        const leadFreq = leadScale[Math.floor(Math.random() * leadScale.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(leadFreq, t);

        gain.gain.setValueAtTime(0.07 * this.musicVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      }

      this.musicStep = (this.musicStep + 1) % 32;
    }, stepDuration);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // 8. Freeze-Sound (Joker: Zeit anhalten)
  playFreeze() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    // Kristallisierendes Eis-Arpeggio
    const freqs = [880, 1174.66, 1396.91, 1760]; // A5, D6, F6, A6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.4);
    });
  }

  // 9. Extra-Joker verdient Chime
  playJokerEarned() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    const freqs = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.5);
    });
  }
}

// Global instanziieren
window.audio = new ArcadeAudio();
