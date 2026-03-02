import { fireEvent, render, screen } from "@testing-library/react";
import App from "../../App";

describe('App smoke', () => {
  it('opens settings dialog from top bar', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /открыть настройки/i }));

    expect(screen.getByRole('heading', { name: /настройки/i })).toBeInTheDocument();
    expect(
      screen.getByText(/закладываем рабочий каркас окна/i)
    ).toBeInTheDocument();
  });
});
