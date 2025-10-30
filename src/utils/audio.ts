// Audio utilities using Web Audio API for sound effects

class GameAudio {
  private audioContext: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private musicOscillator: OscillatorNode | null = null;
  private musicInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.musicGainNode = this.audioContext.createGain();
      this.sfxGainNode = this.audioContext.createGain();
      this.musicGainNode.connect(this.audioContext.destination);
      this.sfxGainNode.connect(this.audioContext.destination);
      this.musicGainNode.gain.value = 0.3; // Music volume
      this.sfxGainNode.gain.value = 0.5; // SFX volume
    }
  }

  // Play a simple tone
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', gainNode?: GainNode) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(gainNode || this.sfxGainNode!);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Fun voting music (upbeat melody loop)
  playVotingMusic() {
    if (!this.audioContext || !this.musicGainNode) return;

    this.stopMusic();

    // Simple melody pattern
    const melody = [
      { freq: 523.25, dur: 0.2 }, // C5
      { freq: 587.33, dur: 0.2 }, // D5
      { freq: 659.25, dur: 0.2 }, // E5
      { freq: 698.46, dur: 0.2 }, // F5
      { freq: 783.99, dur: 0.4 }, // G5
      { freq: 659.25, dur: 0.2 }, // E5
      { freq: 523.25, dur: 0.4 }, // C5
    ];

    let noteIndex = 0;
    
    const playNextNote = () => {
      if (!this.audioContext || !this.musicGainNode) return;
      
      const note = melody[noteIndex];
      this.playTone(note.freq, note.dur, 'triangle', this.musicGainNode);
      
      noteIndex = (noteIndex + 1) % melody.length;
    };

    // Play first note immediately
    playNextNote();
    
    // Loop through melody
    this.musicInterval = setInterval(playNextNote, 250);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicOscillator) {
      try {
        this.musicOscillator.stop();
      } catch (e) {
        // Already stopped
      }
      this.musicOscillator = null;
    }
  }

  // Elimination sound (sad trombone effect)
  playEliminationSound() {
    if (!this.audioContext) return;

    // Descending sad trombone
    const notes = [
      { freq: 392, delay: 0 },    // G
      { freq: 369.99, delay: 0.3 }, // F#
      { freq: 349.23, delay: 0.6 }, // F
      { freq: 293.66, delay: 0.9 }, // D
    ];

    notes.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.freq, 0.4, 'sawtooth');
      }, note.delay * 1000);
    });
  }

  // Win sound (triumphant fanfare)
  playWinSound() {
    if (!this.audioContext) return;

    // Ascending triumphant fanfare
    const notes = [
      { freq: 523.25, delay: 0 },    // C5
      { freq: 659.25, delay: 0.15 }, // E5
      { freq: 783.99, delay: 0.3 },  // G5
      { freq: 1046.50, delay: 0.45 }, // C6
    ];

    notes.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.freq, 0.6, 'sine');
      }, note.delay * 1000);
    });

    // Extra celebratory flourish
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.playTone(1318.51, 0.1, 'sine'); // E6
        }, i * 100);
      }
    }, 700);
  }

  // Message sent sound (subtle pop)
  playMessageSent() {
    if (!this.audioContext) return;
    this.playTone(800, 0.1, 'sine');
    setTimeout(() => this.playTone(1000, 0.1, 'sine'), 50);
  }

  // Message received sound (subtle beep)
  playMessageReceived() {
    if (!this.audioContext) return;
    this.playTone(600, 0.1, 'sine');
  }

  // Vote cast sound
  playVoteCast() {
    if (!this.audioContext) return;
    this.playTone(440, 0.15, 'square');
    setTimeout(() => this.playTone(554.37, 0.15, 'square'), 100);
  }

  // Suspense/reveal sound
  playRevealSound() {
    if (!this.audioContext) return;
    
    // Dramatic drum roll effect
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        this.playTone(100 + i * 10, 0.05, 'sawtooth');
      }, i * 100);
    }
    
    // Final cymbal crash
    setTimeout(() => {
      this.playTone(2000, 0.5, 'square');
      this.playTone(2500, 0.5, 'square');
    }, 1000);
  }
}

export const gameAudio = new GameAudio();

