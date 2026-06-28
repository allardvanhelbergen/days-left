import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import App from "@/App"

describe("App form flow", () => {
  it("reveals onboarding questions one at a time before submit", async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(screen.getByLabelText("Date of birth")).toBeInTheDocument()
    expect(screen.queryByRole("radiogroup", { name: "Biological sex" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show days" })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText("Date of birth"), "1990-05-14")

    expect(screen.getByRole("radiogroup", { name: "Biological sex" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show days" })).not.toBeInTheDocument()

    await user.click(screen.getByLabelText("Female"))

    expect(screen.getByRole("button", { name: "Show days" })).toBeInTheDocument()
  })

  it("hides onboarding and shows a submit-free editor after initial submit", async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.type(screen.getByLabelText("Date of birth"), "1990-05-14")
    await user.click(screen.getByLabelText("Female"))
    await user.click(screen.getByRole("button", { name: "Show days" }))

    expect(screen.getByTestId("onboarding-form")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByTestId("editor-form")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show days" })).not.toBeInTheDocument()
    expect(screen.getByRole("img", { name: /Life visualization/ })).toBeInTheDocument()
  })

  it("keeps the previous visualization while editor date input is invalid", async () => {
    const user = userEvent.setup()

    render(<App editorDebounceMs={0} />)

    await user.type(screen.getByLabelText("Date of birth"), "1990-05-14")
    await user.click(screen.getByLabelText("Male"))
    await user.click(screen.getByRole("button", { name: "Show days" }))

    expect(screen.getByRole("img", { name: /29,565 day cells/ })).toBeInTheDocument()

    const editor = within(screen.getByTestId("editor-form"))
    await user.clear(editor.getByLabelText("Date of birth"))
    await user.type(editor.getByLabelText("Date of birth"), "1990-02-31")

    await waitFor(() => {
      expect(screen.getByText("Enter a real calendar date.")).toBeInTheDocument()
    })
    expect(screen.getByRole("img", { name: /29,565 day cells/ })).toBeInTheDocument()
  })
})
