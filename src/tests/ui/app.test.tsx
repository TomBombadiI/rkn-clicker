import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../App";
import { useGameStore } from "../../app/state";

describe('App smoke', () => {
  beforeEach(() => {
    useGameStore.getState().reset(0);
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
});
