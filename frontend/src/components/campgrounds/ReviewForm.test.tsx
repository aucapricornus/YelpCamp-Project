import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewForm from "./ReviewForm";
import { useCampgroundStore } from "../../store/campgroundStore";

const addReview = vi.fn();
const initialState = useCampgroundStore.getState();

beforeEach(() => {
  addReview.mockReset();
  // Swap the store's real addReview for a mock so no API call is made.
  useCampgroundStore.setState({ ...initialState, addReview }, true);
});

const textarea = () => screen.getByPlaceholderText(/what did you like/i);
const submit = () => screen.getByRole("button", { name: /submit review/i });

describe("ReviewForm", () => {
  it("does not submit an empty review", async () => {
    const user = userEvent.setup();
    render(<ReviewForm campgroundId="c1" />);

    await user.click(submit());

    expect(addReview).not.toHaveBeenCalled();
  });

  it("submits the chosen rating and text, then clears the form", async () => {
    addReview.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ReviewForm campgroundId="c1" />);

    await user.click(screen.getByLabelText("3 stars"));
    await user.type(textarea(), "Quiet spot, clean showers");
    await user.click(submit());

    expect(addReview).toHaveBeenCalledWith("c1", {
      rating: 3,
      body: "Quiet spot, clean showers",
    });
    expect(textarea()).toHaveValue("");
    expect(screen.getByLabelText("5 stars")).toBeChecked();
  });

  it("shows the error message when posting fails", async () => {
    addReview.mockRejectedValue({ message: "You must be logged in" });
    const user = userEvent.setup();
    render(<ReviewForm campgroundId="c1" />);

    await user.type(textarea(), "Hello");
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent("You must be logged in");
    expect(textarea()).toHaveValue("Hello");
  });
});
