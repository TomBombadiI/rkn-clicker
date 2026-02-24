import { render, screen } from "@testing-library/react";
import App from "../../App";

describe('App smoke', () => {
  it('renders main heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /vite \+ react/i })
    ).toBeInTheDocument();
  })
});
