import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { useUserStore } from "../../store/userStore";

const initialState = useUserStore.getState();

// Renders a tiny app with one protected and one public page so we can see
// where each route guard sends the user.
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/campgrounds/new" element={<h1>New campground form</h1>} />
        </Route>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<h1>Login page</h1>} />
        </Route>
        <Route path="/campgrounds" element={<h1>Campgrounds list</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useUserStore.setState(initialState, true);
});

describe("ProtectedRoute", () => {
  it("shows the page to a logged-in user", () => {
    useUserStore.setState({ isCheckingAuth: false, isAuthenticated: true });
    renderAt("/campgrounds/new");
    expect(screen.getByRole("heading", { name: "New campground form" })).toBeInTheDocument();
  });

  it("redirects a logged-out user to /login", () => {
    useUserStore.setState({ isCheckingAuth: false, isAuthenticated: false });
    renderAt("/campgrounds/new");
    expect(screen.getByRole("heading", { name: "Login page" })).toBeInTheDocument();
    expect(screen.queryByText("New campground form")).not.toBeInTheDocument();
  });

  it("shows neither page while auth is still being checked", () => {
    useUserStore.setState({ isCheckingAuth: true, isAuthenticated: false });
    renderAt("/campgrounds/new");
    expect(screen.queryByText("New campground form")).not.toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});

describe("PublicRoute", () => {
  it("shows the login page to a logged-out user", () => {
    useUserStore.setState({ isCheckingAuth: false, isAuthenticated: false });
    renderAt("/login");
    expect(screen.getByRole("heading", { name: "Login page" })).toBeInTheDocument();
  });

  it("sends a logged-in user to /campgrounds", () => {
    useUserStore.setState({ isCheckingAuth: false, isAuthenticated: true });
    renderAt("/login");
    expect(screen.getByRole("heading", { name: "Campgrounds list" })).toBeInTheDocument();
  });
});
