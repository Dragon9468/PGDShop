// ==============================================================================
// PGDShop - Sound & Voice Notification Engine (Bluetooth Speaker & Web Audio)
// ==============================================================================

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private voiceRate: number = 1.0;

  constructor() {
    // Lazy init audio context on user interaction
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public setVoiceRate(rate: number) {
    this.voiceRate = rate;
  }

  /**
   * Âm thanh "Bíp" khi máy quét barcode đọc mã sản phẩm
   */
  public playBarcodeBeep() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime); // 1.8kHz sắc nét
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('AudioContext beep error:', e);
    }
  }

  /**
   * Âm thanh chuông báo thanh toán thành công (2 nốt ngân vang)
   */
  public playSuccessChime() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Note 1: 523.25 Hz (C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: 783.99 Hz (G5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('AudioContext chime error:', e);
    }
  }

  /**
   * Đọc thông báo giọng nói tiếng Việt qua loa Bluetooth / Loa quầy
   */
  public speakVietnamese(text: string) {
    if (!this.isEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.log('TTS:', text);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Dừng câu trước nếu còn đang nói
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = this.voiceRate || 1.0;
      utterance.pitch = 1.0;

      // Ưu tiên chọn giọng tiếng Việt nếu có trong hệ thống
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VN'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }

  /**
   * Thông báo thanh toán chuyển khoản thành công
   */
  public announceTransferSuccess(amount: number) {
    this.playSuccessChime();
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
    const message = `Đã nhận thanh toán thành công ${formattedAmount} đồng qua ngân hàng. Cửa hàng xin cảm ơn quý khách!`;
    setTimeout(() => {
      this.speakVietnamese(message);
    }, 400);
  }

  /**
   * Thông báo thanh toán tiền mặt thành công
   */
  public announceCashSuccess(amount: number) {
    this.playSuccessChime();
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
    const message = `Đã thu ${formattedAmount} đồng tiền mặt. Cảm ơn quý khách!`;
    setTimeout(() => {
      this.speakVietnamese(message);
    }, 300);
  }
}

export const soundService = new SoundService();
