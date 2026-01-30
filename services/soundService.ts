export class SoundService {
  private static audioContext: AudioContext | null = null;
  private static sounds: Map<string, AudioBuffer> = new Map();
  private static ambientSource: AudioBufferSourceNode | null = null;

  static async init(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Pre-generate all sound effects
      await this.generateAllSounds();
    }
  }

  static async ensureContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      await this.init();
    }
    
    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume();
    }
    
    return this.audioContext!;
  }

  private static async generateAllSounds(): Promise<void> {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;

    const createBuffer = (duration: number) => ctx.createBuffer(1, sampleRate * duration, sampleRate);

    // Boot-up chime
    const bootChime = createBuffer(2);
    const bootData = bootChime.getChannelData(0);
    for (let i = 0; i < bootData.length; i++) {
      const t = i / sampleRate;
      const freq = 220 + (t * 220);
      bootData[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2) * 0.3;
      if (i > sampleRate * 0.3) bootData[i] += bootData[i - Math.floor(sampleRate * 0.3)] * 0.3;
    }
    this.sounds.set('boot', bootChime);

    // Click
    const click = createBuffer(0.1);
    const clickData = click.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) {
      const t = i / sampleRate;
      clickData[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 50) * 0.2;
    }
    this.sounds.set('click', click);

    // Scan
    const scan = createBuffer(0.5);
    const scanData = scan.getChannelData(0);
    for (let i = 0; i < scanData.length; i++) {
      const t = i / sampleRate;
      const freq = 300 + (t * 400);
      scanData[i] = Math.sin(2 * Math.PI * freq * t) * (t < 0.1 ? t*10 : (t > 0.4 ? (0.5-t)*10 : 1)) * 0.25;
    }
    this.sounds.set('scan', scan);

    // Discovery Common
    const discCommon = createBuffer(1.5);
    const discCommonData = discCommon.getChannelData(0);
    const chordCommon = [261.63, 329.63, 392.00]; // C Major
    for (let i = 0; i < discCommonData.length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 2);
      let s = 0;
      chordCommon.forEach((f, idx) => {
        if (t >= idx * 0.05) s += Math.sin(2 * Math.PI * f * (t - idx * 0.05)) * 0.15;
      });
      discCommonData[i] = s * env;
    }
    this.sounds.set('discovery_common', discCommon);

    // Discovery Rare/Epic
    const discRare = createBuffer(2);
    const discRareData = discRare.getChannelData(0);
    const chordRare = [261.63, 329.63, 392.00, 523.25, 659.25]; // C Major 9
    for (let i = 0; i < discRareData.length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 1.5);
      let s = 0;
      chordRare.forEach((f, idx) => {
         // Arpeggio style
         if (t >= idx * 0.1) s += Math.sin(2 * Math.PI * f * (t - idx * 0.1)) * 0.15;
      });
      discRareData[i] = s * env;
    }
    this.sounds.set('discovery_rare', discRare);

    // Discovery Legendario (Fanfare)
    const discLeg = createBuffer(3);
    const discLegData = discLeg.getChannelData(0);
    // Trumpet-ish harmonics
    const trumpet = (t: number, f: number) => {
        return (Math.sin(2 * Math.PI * f * t) + 
                0.5 * Math.sin(2 * Math.PI * f * 2 * t) + 
                0.3 * Math.sin(2 * Math.PI * f * 3 * t)) / 1.8;
    };
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G-C-E-G-C
    for (let i = 0; i < discLegData.length; i++) {
        const t = i / sampleRate;
        let s = 0;
        // Triplet pickup
        if (t < 0.1) s += trumpet(t, 392.00) * Math.min(1, t*20); // G
        else if (t < 0.2) s += trumpet(t-0.1, 392.00); 
        else if (t < 0.3) s += trumpet(t-0.2, 392.00);
        else {
             // Big chord
             const tc = t - 0.3;
             const env = Math.exp(-tc);
             s += (trumpet(tc, 523.25) + trumpet(tc, 659.25) + trumpet(tc, 783.99)) * env * 0.3;
             
             // High note
             if (tc > 0.1) s += trumpet(tc-0.1, 1046.50) * env * 0.2;
        }
        discLegData[i] = s * 0.5;
    }
    this.sounds.set('discovery_legendario', discLeg);

    // Nav
    const nav = createBuffer(0.15);
    const navData = nav.getChannelData(0);
    for (let i = 0; i < navData.length; i++) {
       const t = i / sampleRate;
       navData[i] = Math.sin(2 * Math.PI * 600 * t) * Math.sin(Math.PI * t / 0.15) * 0.2;
    }
    this.sounds.set('nav', nav);

    // Error
    const err = createBuffer(0.8);
    const errData = err.getChannelData(0);
    for (let i = 0; i < errData.length; i++) {
       const t = i / sampleRate;
       const f = 200 - (t * 100);
       errData[i] = Math.tanh(Math.sin(2 * Math.PI * f * t) * 3) * Math.exp(-t * 2) * 0.3 * 0.7;
    }
    this.sounds.set('error', err);

    // Achievement
    const ach = createBuffer(2);
    const achData = ach.getChannelData(0);
    const achNotes = [523.25, 659.25, 783.99, 1046.50];
    for (let i = 0; i < achData.length; i++) {
        const t = i / sampleRate;
        let s = 0;
        achNotes.forEach((f, idx) => {
            if (t >= idx * 0.1) s += Math.sin(2 * Math.PI * f * (t - idx * 0.1)) * 0.1;
        });
        achData[i] = s * Math.exp(-t);
    }
    this.sounds.set('achievement', ach);

    // Shutter
    const shut = createBuffer(0.3);
    const shutData = shut.getChannelData(0);
    for (let i = 0; i < shutData.length; i++) {
        const t = i / sampleRate;
        if (t < 0.02) shutData[i] = (Math.random()-0.5) * 0.8 * Math.exp(-t*100);
        else if (t < 0.15) shutData[i] = Math.sin(2*Math.PI*150*(t-0.02)) * Math.exp(-(t-0.02)*20) * 0.1;
    }
    this.sounds.set('shutter', shut);

    // Ambient (Forest/Noise) - 5 seconds loop
    const ambient = createBuffer(5);
    const ambData = ambient.getChannelData(0);
    for (let i = 0; i < ambData.length; i++) {
        const t = i / sampleRate;
        // Pink noise approximation
        const white = Math.random() * 2 - 1;
        const b0 = 0.99886 * (i > 0 ? ambData[i-1] : 0) + white * 0.0555179;
        // Modulate volume slowly
        const vol = 0.05 + 0.02 * Math.sin(2 * Math.PI * 0.2 * t);
        ambData[i] = b0 * vol;
        // Add "bird" chirps randomly
        if (Math.random() < 0.0001) {
             // chirp logic would be complex here, keeping it simple noise for now
        }
    }
    this.sounds.set('ambient', ambient);
  }

  static async play(soundName: string, volume: number = 1.0, loop: boolean = false): Promise<AudioBufferSourceNode | undefined> {
    try {
      const ctx = await this.ensureContext();
      const buffer = this.sounds.get(soundName);
      
      if (!buffer) {
        console.warn(`Sound '${soundName}' not found`);
        return;
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = buffer;
      source.loop = loop;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
      
      source.start();
      return source;
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  // Convenience methods
  static playBootSound() { return this.play('boot', 0.6); }
  static playClick() { return this.play('click', 0.3); }
  static playScanBeep() { return this.play('scan', 0.4); }
  
  static playDiscovery(rarity: string = 'Común') { 
    let sound = 'discovery_common';
    if (['Raro', 'Poco Común'].includes(rarity)) sound = 'discovery_rare';
    if (['Épico', 'Legendario'].includes(rarity)) sound = 'discovery_legendario';
    return this.play(sound, 0.5); 
  }

  static playNavigation() { return this.play('nav', 0.3); }
  static playError() { return this.play('error', 0.4); }
  static playAchievement() { return this.play('achievement', 0.6); }
  static playShutter() { return this.play('shutter', 0.4); }

  static async playAmbient(enable: boolean) {
     if (enable) {
         if (!this.ambientSource) {
             this.ambientSource = await this.play('ambient', 0.3, true) || null;
         }
     } else {
         if (this.ambientSource) {
             try { this.ambientSource.stop(); } catch(e) {}
             this.ambientSource = null;
         }
     }
  }

  static async playBootSequence(): Promise<void> {
    await this.playBootSound();
    setTimeout(() => this.playClick(), 800);
    setTimeout(() => this.playNavigation(), 1200);
    setTimeout(() => this.playClick(), 1600);
  }

  static async playDiscoverySequence(): Promise<void> {
    await this.playScanBeep();
  }
}
