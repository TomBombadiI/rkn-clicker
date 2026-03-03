import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  initYandexSdk,
  readyYandexSdk,
  resetYandexSdkForTests,
} from "../../../infra/yandex";

describe("yandexSdk", () => {
  beforeEach(() => {
    delete window.YaGames;
    resetYandexSdkForTests();
    vi.restoreAllMocks();
  });

  it("falls back to safe no-op methods when YaGames is unavailable (smoke)", async () => {
    const sdk = await initYandexSdk();

    await expect(sdk.showFullscreenAd()).resolves.toBe(false);
    await expect(sdk.showRewardedAd()).resolves.toBe(false);
    await expect(readyYandexSdk()).resolves.toBeUndefined();
  });

  it("initializes SDK once and calls ready once even on repeated startup hooks (regression guard)", async () => {
    const readySpy = vi.fn();
    const initSpy = vi.fn(async () => ({
      features: {
        LoadingAPI: {
          ready: readySpy,
        },
      },
    }));

    window.YaGames = {
      init: initSpy,
    };

    await readyYandexSdk();
    await readyYandexSdk();

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(readySpy).toHaveBeenCalledTimes(1);
  });
});
