import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { I18nProvider } from "../i18n/I18n.jsx";
import { AppProvider } from "../state/app.jsx";
import SearchForm from "./SearchForm.jsx";
import SeatMap from "./SeatMap.jsx";

// Shows where the app navigated to
function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

function renderWithApp(ui) {
  render(
    <I18nProvider>
      <AppProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={ui} />
            <Route path="/trips" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </I18nProvider>
  );
}

describe("SearchForm", () => {
  it("swaps the two cities", async () => {
    renderWithApp(<SearchForm initial={{ from: "CAI", to: "LXR", date: "2027-03-14" }} />);
    const [from, to] = screen.getAllByRole("combobox");
    expect(from).toHaveValue("Cairo");
    expect(to).toHaveValue("Luxor");
    await userEvent.click(screen.getByRole("button", { name: "Swap cities" }));
    expect(from).toHaveValue("Luxor");
    expect(to).toHaveValue("Cairo");
  });

  it("picks a city with the keyboard", async () => {
    renderWithApp(<SearchForm initial={{ from: "CAI", to: "LXR", date: "2027-03-14" }} />);
    const to = screen.getAllByRole("combobox")[1];
    await userEvent.click(to);
    await userEvent.keyboard("Alex");
    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(1);
    await userEvent.keyboard("{Enter}");
    expect(to).toHaveValue("Alexandria");
  });

  it("goes to the results with the search in the address", async () => {
    renderWithApp(<SearchForm initial={{ from: "CAI", to: "HRG", date: "2027-03-14", pax: 2 }} />);
    await userEvent.click(screen.getByRole("button", { name: "Search trips" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/trips?from=CAI&to=HRG&date=2027-03-14&pax=2");
  });
});

describe("SeatMap", () => {
  it("picks seats, skips taken ones and moves with arrow keys", async () => {
    const onToggle = vi.fn();
    renderWithApp(<SeatMap busClass="comfort" taken={new Set(["A2"])} picked={["B1"]} onToggle={onToggle} />);
    const a1 = screen.getByRole("button", { name: /Seat A1,/ });
    const a2 = screen.getByRole("button", { name: /Seat A2,/ });
    expect(screen.getByRole("button", { name: /Seat B1,/ })).toHaveAttribute("aria-pressed", "true");
    expect(a2).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(a2);
    expect(onToggle).not.toHaveBeenCalled();
    await userEvent.click(a1);
    expect(onToggle).toHaveBeenCalledWith("A1");

    a1.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: /Seat B1,/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    // Skips the aisle from seat 2 to seat 3
    expect(screen.getByRole("button", { name: /Seat B3,/ })).toHaveFocus();
  });
});
