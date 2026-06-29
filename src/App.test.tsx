import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { readFileSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"

import App, { ONBOARDING_REVEAL_DELAY_MS } from "@/App"

describe("App form flow", () => {
  it("uses a short default onboarding reveal delay", () => {
    expect(ONBOARDING_REVEAL_DELAY_MS).toBe(250)
  })

  it("formats typed onboarding dates and delays each reveal step", async () => {
    vi.useFakeTimers()

    render(<App onboardingRevealDelayMs={250} />)

    expect(screen.getByTestId("onboarding-form")).not.toHaveClass("-translate-y-1/2")
    expect(screen.getByTestId("onboarding-motion-stack")).toHaveClass("transition-transform")
    expect(screen.getByLabelText("I was born on")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Choose date of birth" })).not.toBeInTheDocument()
    expect(screen.queryByRole("radiogroup", { name: "I was born a" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show days" })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("I was born on"), {
      target: { value: "12051990" },
    })

    expect(screen.getByLabelText("I was born on")).toHaveValue("12-05-1990")
    expect(screen.queryByRole("radiogroup", { name: "I was born a" })).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(249))
    expect(screen.queryByRole("radiogroup", { name: "I was born a" })).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole("radiogroup", { name: "I was born a" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show days" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText("Female"))

    const femaleOption = screen.getByLabelText("Female").closest("[data-slot='field']")
    expect(femaleOption).toHaveAttribute("data-selected", "true")
    expect(screen.queryByRole("button", { name: "Show days" })).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(250))
    expect(screen.getByRole("button", { name: "Show days" })).toBeInTheDocument()
  })

  it("keeps selected radio options lift-only without a filled pill surface", () => {
    const css = readFileSync("src/index.css", "utf8")
    const selectedRule = css.match(
      /\.life-radio-option\[data-selected="true"\]\s*\{(?<body>[^}]+)\}/,
    )?.groups?.body

    expect(selectedRule).toContain("box-shadow")
    expect(selectedRule).toContain("transform")
    expect(selectedRule).not.toContain("background:")
    expect(selectedRule).not.toContain("border-color:")
  })

  it("hides onboarding and shows a submit-free editor after initial submit", async () => {
    const user = userEvent.setup()

    render(<App onboardingRevealDelayMs={0} />)

    await user.type(screen.getByLabelText("I was born on"), "14051990")
    await user.click(screen.getByLabelText("Female"))
    await user.click(screen.getByRole("button", { name: "Show days" }))

    expect(screen.getByTestId("onboarding-form")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByTestId("editor-form")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show days" })).not.toBeInTheDocument()
    expect(within(screen.getByTestId("editor-form")).getByLabelText("Date of birth")).toHaveValue("1990-05-14")
    expect(screen.getByRole("img", { name: /Life visualization/ })).toBeInTheDocument()
  })

  it("keeps the previous visualization while editor date input is invalid", async () => {
    const user = userEvent.setup()

    render(<App editorDebounceMs={0} onboardingRevealDelayMs={0} />)

    await user.type(screen.getByLabelText("I was born on"), "14051990")
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
