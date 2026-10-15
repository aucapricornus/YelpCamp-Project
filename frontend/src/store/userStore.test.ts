import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUserStore } from "./userStore";
import { loginUser, logoutUser, getMe } from "../api/auth";
import { postUser } from "../api/users";

vi.mock("../api/auth");
vi.mock("../api/users");

const initialState = useUserStore.getState();
const user = { _id: "u1", username: "daniel", email: "daniel@example.com" };

// Mimics the shape of an axios error coming back from the API.
const apiError = (message: string) => ({ response: { data: { message } } });

beforeEach(() => {
  vi.resetAllMocks();
  useUserStore.setState(initialState, true);
});

describe("login", () => {
  it("stores the user and marks them authenticated", async () => {
    vi.mocked(loginUser).mockResolvedValue({ user });
    await useUserStore.getState().login({ email: user.email, password: "pw" });

    const state = useUserStore.getState();
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
  });

  it("stores and rethrows the backend error on failure", async () => {
    vi.mocked(loginUser).mockRejectedValue(apiError("Invalid credentials"));

    await expect(
      useUserStore.getState().login({ email: "x@x.com", password: "bad" }),
    ).rejects.toEqual({ message: "Invalid credentials" });

    const state = useUserStore.getState();
    expect(state.error).toEqual({ message: "Invalid credentials" });
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});

describe("createUser", () => {
  it("logs the new user in after registering", async () => {
    vi.mocked(postUser).mockResolvedValue({ user });
    const created = await useUserStore
      .getState()
      .createUser({ username: "daniel", email: user.email, password: "secret1" });

    expect(created).toEqual(user);
    expect(useUserStore.getState().isAuthenticated).toBe(true);
    expect(useUserStore.getState().users).toContainEqual(user);
  });

  it("falls back to the error message when there is no response body", async () => {
    vi.mocked(postUser).mockRejectedValue(new Error("Network Error"));
    await expect(
      useUserStore.getState().createUser({ username: "a", email: "a@a.com", password: "secret1" }),
    ).rejects.toEqual({ message: "Network Error" });
  });
});

describe("logout", () => {
  it("clears the user", async () => {
    useUserStore.setState({ user, isAuthenticated: true });
    vi.mocked(logoutUser).mockResolvedValue({});
    await useUserStore.getState().logout();

    expect(useUserStore.getState().user).toBeNull();
    expect(useUserStore.getState().isAuthenticated).toBe(false);
  });
});

describe("checkAuth", () => {
  it("restores the session when the cookie is valid", async () => {
    vi.mocked(getMe).mockResolvedValue({ user });
    await useUserStore.getState().checkAuth();

    const state = useUserStore.getState();
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isCheckingAuth).toBe(false);
  });

  it("treats a failed check as logged out without showing an error", async () => {
    vi.mocked(getMe).mockRejectedValue(apiError("Not authorized"));
    await useUserStore.getState().checkAuth();

    const state = useUserStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isCheckingAuth).toBe(false);
    expect(state.error).toBeNull();
  });
});
