// Sound.js - Système de son simple
Game.Sound = {
  enabled: true,
  
  play(frequency, duration = 100, type = 'square') {
    if (!this.enabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch(e) {
      console.warn("Son désactivé:", e);
    }
  },
  
  gunshot() {
    this.play(150, 50, 'sawtooth');
  },
  
  hit() {
    this.play(100, 100, 'square');
  },
  
  pickup() {
    this.play(800, 100, 'sine');
  }
};