function canPlayUiAudio(): boolean {
  if (typeof Audio === 'undefined') {
    return false;
  }

  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
    return false;
  }

  return true;
}

type PlayUiSoundOptions = {
  enabled?: boolean;
  volume?: number;
};

const audioCache = new Map<string, HTMLAudioElement>();

export function playUiSound(src: string, options: PlayUiSoundOptions = {}): void {
  const { enabled = true, volume = 0.35 } = options;

  if (!enabled || !canPlayUiAudio()) {
    return;
  }

  let audio = audioCache.get(src);

  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    audioCache.set(src, audio);
  }

  audio.volume = volume;
  audio.currentTime = 0;

  try {
    const playback = audio.play();

    if (playback && typeof playback.catch === 'function') {
      void playback.catch(() => {
        // Ignore playback failures: sound is optional feedback.
      });
    }
  } catch {
    // Ignore playback errors: sound is optional feedback.
  }
}
