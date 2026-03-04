import banSound from '@/assets/ban.wav';
import errorSound from '@/assets/error.wav';
import finalSound from '@/assets/final.wav';
import notifyGoodSound from '@/assets/good-notify.wav';
import clickSound from '@/assets/mixkit-modern-technology-select-3124.wav';
import slowSound from '@/assets/slow.wav';

export const uiSounds = {
  click: clickSound,
  slow: slowSound,
  ban: banSound,
  final: finalSound,
  notifyGood: notifyGoodSound,
  notifyError: errorSound,
} as const;
