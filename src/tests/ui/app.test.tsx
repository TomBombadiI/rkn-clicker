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

    expect(screen.getByText(/доход в секунду: 10/i)).toBeInTheDocument();
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
});
