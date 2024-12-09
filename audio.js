class AudioManager {
  constructor() {
    this.audioContext = null;
    this.voices = []; // Array to store each oscillator instance
    this.isPlaying = false;
    this.isPaused = false;
  }

  initializeAudioContext() {
    // Initialize the audio context only if it hasn't been initialized yet
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume the audio context if it is suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  getFrequency(ratio, baseFreq) {
    const [numerator, denominator] = ratio.split('/').map(Number);
    return baseFreq * (numerator / denominator);
  }

  addVoice(ratio, baseFreq) {
    // Initialize context if it doesn't exist
    this.initializeAudioContext();

    const frequency = this.getFrequency(ratio, baseFreq);

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();

    if (this.isPlaying) {
      this.rampGain(gainNode, 0, 0.15, 0.01);
    }

    // Assign a unique ID to each voice
    const voice = {
      id: Date.now() + Math.random(),
      ratio,
      oscillator,
      gainNode,
    };

    this.voices.push(voice);

    return voice.id;
  }

  updateVoice(voiceId, numerator, denominator, baseFreq) {
    const voice = this.voices.find(v => v.id == voiceId);
    if (voice) {
      const frequency = this.getFrequency(`${numerator}/${denominator}`, baseFreq);
      voice.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    }
  }

  removeVoiceById(id) {
    const index = this.voices.findIndex(voice => voice.id == id);

    if (index !== -1) {
      const voice = this.voices[index];
      const { oscillator, gainNode } = voice;

      // Ramp down the gain to prevent clicks
      gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext.currentTime);
      this.rampGain(gainNode, gainNode.gain.value, 0, 0.1);

      // Stop and disconnect oscillator after gain reaches zero
      setTimeout(() => {
        try {
          oscillator.stop();
        } catch (e) {
          console.warn('Oscillator already stopped:', e);
        }
        oscillator.disconnect();
        gainNode.disconnect();
      }, 150);

      this.voices.splice(index, 1);
    }
  }

  pause() {
    this.isPaused = true;
    this.isPlaying = false;

    this.voices.forEach(({ gainNode }) => {
      gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext.currentTime);
      this.rampGain(gainNode, gainNode.gain.value, 0, 0.1);
    });
  }

  play() {
    this.initializeAudioContext();
    this.isPlaying = true;
    this.isPaused = false;

    this.voices.forEach(({ gainNode }) => {
      this.rampGain(gainNode, 0, 0.15, 0.01);
    });
  }

  updateFrequencies(baseFreq) {
    this.voices.forEach(({ oscillator, ratio }) => {
      const frequency = this.getFrequency(ratio, baseFreq);
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    });
  }

  // Helper function to ramp gain
  rampGain(gainNode, fromValue, toValue, duration) {
    gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(fromValue, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(toValue, this.audioContext.currentTime + duration);
  }
}