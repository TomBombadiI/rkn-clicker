import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";
import { useGameStore } from "../../app/state";
import { GAME_BALANCE } from "../../engine/config";

describe('App smoke', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useGameStore.getState().reset(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('increments score after clicking the main action button', () => {
    render(<App />);

    expect(screen.getByText(/очки блокировки: 0/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));

    expect(screen.getByText(/очки блокировки: 1/i)).toBeInTheDocument();
  });

  it('opens settings dialog from top bar', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /открыть настройки/i }));

    expect(screen.getByRole('heading', { name: /настройки/i })).toBeInTheDocument();
    expect(
      screen.getByText(/закладываем рабочий каркас окна/i)
    ).toBeInTheDocument();
  });

  it('buys slow for the first service and enables passive income', () => {
    render(<App />);

    for (let i = 0; i < 10; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));
    }

    fireEvent.click(screen.getByRole('button', { name: /замедлить telegram/i }));

    expect(screen.getByText(/доход в секунду: 20/i)).toBeInTheDocument();
    expect(screen.getByText(/паника в сети/i)).toBeInTheDocument();
    expect(screen.getByText(/осталось: 20 сек/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /замедлить telegram/i })).toBeDisabled();
    expect(screen.getByText(/статус: slowed/i)).toBeInTheDocument();
  });

  it('saves manually and resets progress from the bottom bar', () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<App />);

    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));
    }

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

    const savedBeforeReset = window.localStorage.getItem(GAME_BALANCE.saveStorageKey);
    expect(savedBeforeReset).not.toBeNull();
    expect(screen.getByText(/очки блокировки: 3/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /сбросить прогресс/i }));

    expect(screen.getByText(/очки блокировки: 0/i)).toBeInTheDocument();

    const savedAfterReset = window.localStorage.getItem(GAME_BALANCE.saveStorageKey);
    expect(savedAfterReset).not.toBeNull();
    expect(JSON.parse(savedAfterReset ?? "{}").score).toBe(0);
  });

  it('buys ban for the first service and updates multiplier and dissent', () => {
    render(<App />);

    for (let i = 0; i < 20; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /^блокировать$/i }));
    }

    fireEvent.click(screen.getByRole('button', { name: /заблокировать telegram/i }));

    expect(screen.getByText(/множитель блокировок: x2/i)).toBeInTheDocument();
    expect(screen.getByText(/народное недовольство: 25%/i)).toBeInTheDocument();
    expect(screen.getByText(/статус: banned/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /заблокировать telegram/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /замедлить telegram/i })).toBeDisabled();
  });

  it('shows end screen after buying MAX', () => {
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: 100,
        blockMultiplier: 16,
        bannedCount: 4,
        serviceProgresses: {
          telegram: "banned",
          whatsapp: "banned",
          instagram: "banned",
          youtube: "banned",
        },
        maxUnlocked: true,
        dissentPercent: 100,
      },
    }));
    useGameStore.getState().save();

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /заблокировать max/i }));

    expect(screen.getByRole('heading', { name: /max заблокирован/i })).toBeInTheDocument();
    expect(screen.getByText(/игра завершена/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^блокировать$/i })).not.toBeInTheDocument();
  });
});
