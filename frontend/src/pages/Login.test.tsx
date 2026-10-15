import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import { useUserStore } from "../store/userStore";

const login = vi.fn();
const initialState = useUserStore.getState();

beforeEach(() => {
  login.mockReset();
  useUserStore.setState({ ...initialState, login }, true);
  vi.spyOn(console, "error").mockImplementation(() => {}); // Login logs failures
});

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/campgrounds" element={<h1>Campgrounds list</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Login page", () => {
  it("does not call login when fields are empty", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(login).not.toHaveBeenCalled();
  });

  it("logs in and goes to /campgrounds", async () => {
    login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "daniel@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(login).toHaveBeenCalledWith({ email: "daniel@example.com", password: "secret123" });
    expect(await screen.findByRole("heading", { name: "Campgrounds list" })).toBeInTheDocument();
  });

  it("stays on the page when login fails", async () => {
    login.mockRejectedValue({ message: "Invalid credentials" });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "daniel@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    expect(screen.queryByText("Campgrounds list")).not.toBeInTheDocument();
  });

  it("links to the register page", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: /register here/i })).toHaveAttribute("href", "/register");
  });
});
