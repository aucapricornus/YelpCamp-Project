import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCampgroundStore, type Campground } from "./campgroundStore";
import * as campgroundsApi from "../api/campgrounds";
import * as reviewsApi from "../api/reviews";

vi.mock("../api/campgrounds");
vi.mock("../api/reviews");

const initialState = useCampgroundStore.getState();
const author = { _id: "u1", username: "daniel", email: "d@example.com" };

const makeCamp = (overrides: Partial<Campground> = {}): Campground => ({
  _id: "c1",
  title: "Pine Ridge",
  images: [],
  geometry: { type: "Point", coordinates: [0, 0] },
  location: "Somewhere",
  description: "Nice",
  price: 10,
  author,
  reviews: [],
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  useCampgroundStore.setState(initialState, true);
});

describe("getCampgrounds", () => {
  it("stores the page of results and the search query", async () => {
    vi.mocked(campgroundsApi.getCampgrounds).mockResolvedValue({
      campgrounds: [makeCamp()],
      currentPage: 2,
      totalPages: 5,
    });

    await useCampgroundStore.getState().getCampgrounds(2, "pine");

    expect(campgroundsApi.getCampgrounds).toHaveBeenCalledWith(2, "pine");
    const state = useCampgroundStore.getState();
    expect(state.campgrounds).toHaveLength(1);
    expect(state.currentPage).toBe(2);
    expect(state.totalPages).toBe(5);
    expect(state.searchQuery).toBe("pine");
    expect(state.loading).toBe(false);
  });

  it("stores the error instead of throwing", async () => {
    vi.mocked(campgroundsApi.getCampgrounds).mockRejectedValue({
      response: { data: { message: "Server down" } },
    });
    await useCampgroundStore.getState().getCampgrounds();
    expect(useCampgroundStore.getState().error).toEqual({
      message: "Server down",
    });
  });

  it("keeps an empty list when the response has no campgrounds", async () => {
    // e.g. VITE_API_URL is missing and the dev server answers with index.html
    vi.mocked(campgroundsApi.getCampgrounds).mockResolvedValue(
      "<!doctype html>...",
    );
    await useCampgroundStore.getState().getCampgrounds();
    expect(useCampgroundStore.getState().campgrounds).toEqual([]);
  });
});

describe("updateCampground", () => {
  it("replaces the campground in the list and as the current one", async () => {
    const original = makeCamp();
    const other = makeCamp({ _id: "c2", title: "Other" });
    useCampgroundStore.setState({
      campgrounds: [original, other],
      campground: original,
    });

    const updated = makeCamp({ title: "Renamed" });
    vi.mocked(campgroundsApi.updateCampground).mockResolvedValue({
      campground: updated,
    });

    await useCampgroundStore
      .getState()
      .updateCampground("c1", { title: "Renamed" });

    const state = useCampgroundStore.getState();
    expect(state.campground?.title).toBe("Renamed");
    expect(state.campgrounds.map((c) => c.title)).toEqual(["Renamed", "Other"]);
  });
});

describe("deleteCampground", () => {
  it("removes it from the list", async () => {
    useCampgroundStore.setState({
      campgrounds: [makeCamp(), makeCamp({ _id: "c2" })],
      campground: makeCamp(),
    });
    vi.mocked(campgroundsApi.deleteCampground).mockResolvedValue({});

    await useCampgroundStore.getState().deleteCampground("c1");

    const state = useCampgroundStore.getState();
    expect(state.campgrounds.map((c) => c._id)).toEqual(["c2"]);
    expect(state.campground).toBeNull();
  });

  it("keeps the list and rethrows when the API refuses", async () => {
    useCampgroundStore.setState({ campgrounds: [makeCamp()] });
    vi.mocked(campgroundsApi.deleteCampground).mockRejectedValue({
      response: { data: { message: "Forbidden" } },
    });

    await expect(
      useCampgroundStore.getState().deleteCampground("c1"),
    ).rejects.toEqual({
      message: "Forbidden",
    });
    expect(useCampgroundStore.getState().campgrounds).toHaveLength(1);
  });
});

describe("reviews", () => {
  it("addReview appends the new review to the current campground", async () => {
    useCampgroundStore.setState({ campground: makeCamp() });
    const review = { _id: "r1", body: "Great", rating: 5, author };
    vi.mocked(reviewsApi.createReview).mockResolvedValue({ review });

    await useCampgroundStore
      .getState()
      .addReview("c1", { rating: 5, body: "Great" });

    expect(reviewsApi.createReview).toHaveBeenCalledWith("c1", {
      rating: 5,
      body: "Great",
    });
    expect(useCampgroundStore.getState().campground?.reviews).toEqual([review]);
  });

  it("deleteReview removes only that review", async () => {
    const keep = { _id: "r1", body: "Keep", rating: 4, author };
    const remove = { _id: "r2", body: "Remove", rating: 1, author };
    useCampgroundStore.setState({
      campground: makeCamp({ reviews: [keep, remove] }),
    });
    vi.mocked(reviewsApi.deleteReview).mockResolvedValue({});

    await useCampgroundStore.getState().deleteReview("c1", "r2");

    expect(useCampgroundStore.getState().campground?.reviews).toEqual([keep]);
  });
});
