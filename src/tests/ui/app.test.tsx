import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetYandexSdkForTests } from '../../infra/yandex';
import App from '../../App';
import { useGameStore } from '../../app/state';
import { GAME_BALANCE, SERVICES } from '../../engine/config';
import { createInitialState } from '../../engine/state';
import type { ServiceState } from '../../engine/types';

describe('App smoke', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    window.localStorage.clear();
    delete window.YaGames;
    resetYandexSdkForTests();
    useGameStore.getState().reset(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('increments score after clicking the main action button', () => {
    render(<App />);

    expect(screen.getByLabelText(/текущее количество очков/i)).toHaveTextContent('0');

    fireEvent.click(screen.getByRole('button', { name: /набрать очки блокировки/i }));

    expect(screen.getByLabelText(/текущее количество очков/i)).toHaveTextContent('1');
    expect(screen.getByText(/^\+1$/)).toBeInTheDocument();
  });

  it('opens tooltip on first touch tap and closes it on the next tap', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('hover: none') || query.includes('pointer: coarse'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<App />);

    const scoreRegion = screen.getByRole('region', { name: /^очки блокировки$/i });

    fireEvent.click(scoreRegion);

    expect(await screen.findByRole('tooltip')).toHaveTextContent(/текущие очки блокировки/i);

    fireEvent.click(scoreRegion);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens settings dialog from top bar', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /открыть настройки/i }));

    expect(screen.getByRole('heading', { name: /настройки/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /переключить звук/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('shows a badge on the block button when purchases are available', () => {
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: 10,
      },
    }));
    useGameStore.getState().save();

    render(<App />);

    expect(screen.getByText(/^1$/)).toBeInTheDocument();
  });

  it('does not replay availability toasts after hydrate on page load', () => {
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: 10,
      },
    }));
    useGameStore.getState().save();
    useGameStore.setState({
      game: createInitialState(0),
      actionLog: [],
      toasts: [],
    });

    render(<App />);

    expect(screen.getByText(/^1$/)).toBeInTheDocument();
    expect(screen.queryByText(/доступно: замедлить telegram/i)).not.toBeInTheDocument();
  });

  it('shows a toast when a new action becomes available and closes it on click', () => {
    render(<App />);

    for (let i = 0; i < 10; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /набрать очки блокировки/i }));
    }

    const toast = screen.getByText(/доступно: замедлить telegram/i);

    expect(toast).toBeInTheDocument();

    fireEvent.click(toast);

    expect(screen.queryByText(/доступно: замедлить telegram/i)).not.toBeInTheDocument();
  });

  it('shows only the active event banner with its effects', () => {
    render(<App />);

    for (let i = 0; i < 10; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /набрать очки блокировки/i }));
    }

    fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));
    fireEvent.click(screen.getByRole('button', { name: /замедлить telegram/i }));

    const scheduledStartAt = useGameStore.getState().game.scheduledEvent?.startedAt;

    expect(useGameStore.getState().game.scheduledEvent?.name).toBe('Паника в сети');
    expect(scheduledStartAt).toBeDefined();
    expect(screen.queryByLabelText(/активное событие/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /замедлить telegram/i })).toBeDisabled();
    expect(screen.getByRole('tab', { name: /тир 1/i })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('button', { name: /закрыть список сервисов/i }));
    act(() => {
      useGameStore.getState().tick(scheduledStartAt!);
    });

    expect(screen.getByLabelText(/активное событие/i)).toBeInTheDocument();
    expect(screen.getByText(/паника в сети/i)).toBeInTheDocument();
    expect(screen.getByText(/осталось: 20 сек/i)).toBeInTheDocument();
    expect(screen.getByText(/пассив x2/i)).toBeInTheDocument();
  });

  it('starts a bonus event from settings after rewarded ad', async () => {
    window.YaGames = {
      init: vi.fn(async () => ({
        adv: {
          showRewardedVideo: (options?: { callbacks?: { onRewarded?: () => void; onClose?: () => void } }) => {
            options?.callbacks?.onRewarded?.();
            options?.callbacks?.onClose?.();
          },
        },
      })),
    };

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /открыть настройки/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^режим ручной блокировки$/i }));
    });

    expect(screen.queryByRole('heading', { name: /настройки/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/активное событие/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /режим ручной блокировки/i })).toBeInTheDocument();
    expect(screen.getByText(/клик x2/i)).toBeInTheDocument();
    expect(screen.getByText(/бонус получен: режим ручной блокировки/i)).toBeInTheDocument();
  });

  it('saves manually, closes settings, and shows a toast', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App />);

    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /набрать очки блокировки/i }));
    }

    fireEvent.click(screen.getByRole('button', { name: /открыть настройки/i }));
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

    const savedBeforeReset = window.localStorage.getItem(GAME_BALANCE.saveStorageKey);
    expect(savedBeforeReset).not.toBeNull();
    expect(screen.getByLabelText(/текущее количество очков/i)).toHaveTextContent('3');
    expect(screen.queryByRole('heading', { name: /настройки/i })).not.toBeInTheDocument();
    expect(screen.getByText(/прогресс сохранен/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /открыть настройки/i }));
    fireEvent.click(screen.getByRole('button', { name: /^сбросить$/i }));

    expect(screen.getByLabelText(/текущее количество очков/i)).toHaveTextContent('0');

    const savedAfterReset = window.localStorage.getItem(GAME_BALANCE.saveStorageKey);
    expect(savedAfterReset).not.toBeNull();
    expect(JSON.parse(savedAfterReset ?? '{}').score).toBe(0);
  });

  it('buys ban for the first service and updates multiplier and dissent', () => {
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: 20,
      },
    }));
    useGameStore.getState().save();

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));
    fireEvent.click(screen.getByRole('button', { name: /заблокировать telegram/i }));

    expect(useGameStore.getState().game.dissentPercent).toBe(5);
    expect(screen.getByRole('tab', { name: /тир 1/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /заблокировать telegram/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /замедлить telegram/i })).toBeDisabled();
  });

  it('shows end screen after buying MAX', () => {
    const bannedProgresses: Record<string, ServiceState> = Object.fromEntries(
      SERVICES.map((service) => [service.id, 'banned' as ServiceState]),
    );

    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: 100,
        blockMultiplier: 16,
        bannedCount: SERVICES.length,
        serviceProgresses: {
          ...state.game.serviceProgresses,
          ...bannedProgresses,
        },
        maxUnlocked: true,
        dissentPercent: 100,
      },
    }));
    useGameStore.getState().save();

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));
    fireEvent.click(screen.getByRole('button', { name: /заблокировать max/i }));

    expect(screen.getByRole('heading', { name: /max заблокирован/i })).toBeInTheDocument();
    expect(screen.getByText(/игра завершена/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /набрать очки блокировки/i })).not.toBeInTheDocument();
  });

  it('opens the services modal from the block button', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));

    expect(screen.getByRole('heading', { name: /сервисы/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /замедлить telegram/i })).toBeInTheDocument();
  });

  it('opens a service description modal from the question button', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));
    fireEvent.click(screen.getByRole('button', { name: /описание telegram/i }));

    screen.getByRole('dialog', { name: /^telegram$/i });

    expect(screen.getByRole('heading', { name: /^telegram$/i })).toBeInTheDocument();
    expect(screen.getByText(/главный чат страны/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /закрыть описание telegram/i }));

    expect(screen.queryByText(/главный чат страны/i)).not.toBeInTheDocument();
  });

  it('remembers the last active service tier tab between modal openings', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));
    fireEvent.click(screen.getByRole('tab', { name: /тир 3/i }));

    expect(screen.getByRole('tab', { name: /тир 3/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: /тир 3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /замедлить viber/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /закрыть список сервисов/i }));
    fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));

    expect(screen.getByRole('tab', { name: /тир 3/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /замедлить viber/i })).toBeInTheDocument();
  });

  it('toggles sound in settings and reflects the current state', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /открыть настройки/i }));
    fireEvent.click(screen.getByRole('switch', { name: /переключить звук/i }));

    expect(screen.getByRole('switch', { name: /переключить звук/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/звуковые эффекты отключены/i)).toBeInTheDocument();
  });
});

