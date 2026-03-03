type RawYandexSdk = {
  features?: {
    LoadingAPI?: {
      ready?: () => void;
    };
  };
  adv?: {
    showFullscreenAdv?: () => void | Promise<unknown>;
    showRewardedVideo?: () => void | Promise<unknown>;
  };
};

type RawYandexGamesApi = {
  init?: () => Promise<RawYandexSdk>;
};

export type YandexSdkAdapter = {
  ready: () => void;
  showFullscreenAd: () => Promise<boolean>;
  showRewardedAd: () => Promise<boolean>;
};

declare global {
  interface Window {
    YaGames?: RawYandexGamesApi;
  }
}

const fallbackAdapter: YandexSdkAdapter = {
  ready: () => {},
  showFullscreenAd: async () => false,
  showRewardedAd: async () => false,
};

let sdkPromise: Promise<YandexSdkAdapter> | null = null;
let hasSentReady = false;

async function runAd(
  action: (() => void | Promise<unknown>) | undefined,
): Promise<boolean> {
  if (!action) {
    return false;
  }

  try {
    await action();
    return true;
  } catch {
    return false;
  }
}

function createAdapter(rawSdk: RawYandexSdk): YandexSdkAdapter {
  return {
    ready: () => {
      rawSdk.features?.LoadingAPI?.ready?.();
    },
    showFullscreenAd: () => runAd(rawSdk.adv?.showFullscreenAdv),
    showRewardedAd: () => runAd(rawSdk.adv?.showRewardedVideo),
  };
}

export async function initYandexSdk(): Promise<YandexSdkAdapter> {
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = (async () => {
    if (typeof window === "undefined" || !window.YaGames?.init) {
      return fallbackAdapter;
    }

    try {
      const rawSdk = await window.YaGames.init();
      return createAdapter(rawSdk);
    } catch {
      return fallbackAdapter;
    }
  })();

  return sdkPromise;
}

export async function readyYandexSdk(): Promise<void> {
  const sdk = await initYandexSdk();

  if (hasSentReady) {
    return;
  }

  sdk.ready();
  hasSentReady = true;
}

export function resetYandexSdkForTests(): void {
  sdkPromise = null;
  hasSentReady = false;
}
