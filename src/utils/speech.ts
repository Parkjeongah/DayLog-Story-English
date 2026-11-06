// Web Speech Synthesis (TTS) & Web Speech Recognition

export interface TTSSettings {
  rate: number; // 0.75 to 1.5
  accent: 'en-US' | 'en-GB';
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isTTSSupported(): boolean {
    return !!this.synth;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices().filter((v) => v.lang.startsWith('en'));
  }

  public speak(
    text: string,
    options: {
      rate?: number;
      accent?: 'en-US' | 'en-GB';
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    } = {}
  ): void {
    if (!this.synth) {
      options.onEnd?.();
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.accent || 'en-US';
    utterance.rate = options.rate || 1.0;
    utterance.pitch = 1.0;

    // Pick best matching English voice
    const voices = this.getVoices();
    const matchedVoice =
      voices.find((v) => v.lang.includes(options.accent === 'en-GB' ? 'GB' : 'US')) ||
      voices[0];
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      options.onError?.(e);
      options.onEnd?.();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}

export const speechService = new SpeechService();

// Speech Recognition helper
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);
}

export function createSpeechRecognizer(options: {
  lang?: string;
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (error: unknown) => void;
  onEnd?: () => void;
}): { start: () => void; stop: () => void; abort: () => void } {
  if (!isSpeechRecognitionSupported()) {
    return {
      start: () => {
        options.onError?.(new Error('Speech recognition not supported in this browser'));
      },
      stop: () => {},
      abort: () => {},
    };
  }

  const SpeechRec =
    (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

  const recognition = new SpeechRec();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.lang || 'ko-KR';

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }

    options.onResult(final || interim, !!final);
  };

  recognition.onerror = (event: any) => {
    options.onError?.(event.error);
  };

  recognition.onend = () => {
    options.onEnd?.();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        options.onError?.(e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
    abort: () => {
      try {
        recognition.abort();
      } catch {}
    },
  };
}
