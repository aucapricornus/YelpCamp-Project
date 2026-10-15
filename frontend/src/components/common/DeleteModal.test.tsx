import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteModal from "./DeleteModal";

describe("DeleteModal", () => {
  it("renders nothing when hidden", () => {
    render(<DeleteModal show={false} onHide={vi.fn()} onConfirm={vi.fn()} title="Delete?" body="Sure?" />);
    expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
  });

  it("calls onConfirm and onHide from the right buttons", async () => {
    const onHide = vi.fn();
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteModal
        show
        onHide={onHide}
        onConfirm={onConfirm}
        title="Delete campground?"
        body="This cannot be undone."
      />,
    );

    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onHide).toHaveBeenCalledOnce();
  });
});
