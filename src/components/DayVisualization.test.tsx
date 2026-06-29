import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DayVisualization } from "@/components/DayVisualization"
import { DAY_GRID, getDayGridDimensions } from "@/components/day-grid-rendering"
import type { DayCell, LifeStats } from "@/lib/life"

const cells: DayCell[] = [
  {
    index: 0,
    row: 0,
    column: 0,
    dateISO: "2000-01-01",
    status: "past",
  },
  {
    index: 1,
    row: 0,
    column: 1,
    dateISO: "2000-01-02",
    status: "today",
  },
  {
    index: 2,
    row: 0,
    column: 2,
    dateISO: "2000-01-03",
    status: "future",
  },
]

const stats: LifeStats = {
  birthDateISO: "2000-01-01",
  sex: "male",
  todayISO: "2000-01-02",
  model: "fixed-365",
  expectancyYears: 1,
  totalDays: cells.length,
  elapsedDays: 1,
  futureDays: 1,
}

describe("DayVisualization", () => {
  it("renders a single canvas grid without per-day DOM nodes", () => {
    render(<DayVisualization cells={cells} stats={stats} />)

    expect(screen.getByTestId("day-grid-canvas")).toBeInTheDocument()
    expect(screen.getByTestId("day-cell-hover")).toBeInTheDocument()
    expect(document.querySelectorAll("rect.day-cell")).toHaveLength(0)
  })

  it("keeps one hidden tooltip mounted before hover", () => {
    render(<DayVisualization cells={cells} stats={stats} />)

    const tooltip = screen.getByTestId("day-cell-tooltip")

    expect(tooltip).toHaveAttribute("data-visible", "false")
    expect(tooltip).toHaveAttribute("aria-hidden", "true")
    expect(tooltip).toHaveTextContent("")
  })

  it("renders a compact status legend for the filled day cells", () => {
    render(<DayVisualization cells={cells} stats={stats} />)

    const legend = screen.getByTestId("day-status-legend")

    expect(legend).toHaveTextContent("Past")
    expect(legend).toHaveTextContent("Future")
    expect(legend).toHaveTextContent("Today")
    expect(legend.querySelectorAll("[data-testid='day-status-swatch']")).toHaveLength(3)
    expect(document.querySelectorAll("rect.day-cell")).toHaveLength(0)
  })

  it("shows an immediate transform-positioned tooltip through math-based canvas hover handling", async () => {
    render(<DayVisualization cells={cells} stats={stats} />)

    const canvas = screen.getByTestId("day-grid-canvas")
    const hoverOverlay = screen.getByTestId("day-cell-hover")
    const tooltip = screen.getByTestId("day-cell-tooltip")
    const dimensions = getDayGridDimensions(stats.expectancyYears)
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 100,
      left: 100,
      top: 100,
      right: 100 + dimensions.width,
      bottom: 100 + DAY_GRID.cellHeight,
      width: dimensions.width,
      height: DAY_GRID.cellHeight,
      toJSON: () => {},
    })

    expect(hoverOverlay).toHaveAttribute("data-visible", "false")
    expect(tooltip).toHaveAttribute("data-visible", "false")

    fireEvent.pointerEnter(canvas)

    fireEvent.pointerMove(canvas, {
      clientX: 100 + DAY_GRID.cellStepX * 2 + 0.5,
      clientY: 101,
    })

    await waitFor(() => {
      expect(hoverOverlay).toHaveAttribute("data-visible", "true")
    })
    expect(tooltip).toHaveAttribute("data-visible", "true")
    expect(tooltip).toHaveAttribute("aria-hidden", "false")
    expect(tooltip).toHaveTextContent("2000-01-03")
    expect(tooltip.style.left).toBe("")
    expect(tooltip.style.top).toBe("")
    expect(tooltip.style.transform).toContain("translate3d")
    expect(hoverOverlay.style.left).toBe("")
    expect(hoverOverlay.style.top).toBe("")
    expect(hoverOverlay.style.transform).toContain("translate3d")

    fireEvent.pointerLeave(canvas)

    expect(hoverOverlay).toHaveAttribute("data-visible", "false")
    expect(tooltip).toHaveAttribute("data-visible", "false")
    expect(tooltip).toHaveAttribute("aria-hidden", "true")
  })

  it("does not repeatedly read canvas layout while moving across cached grid geometry", () => {
    render(<DayVisualization cells={cells} stats={stats} />)

    const canvas = screen.getByTestId("day-grid-canvas")
    const dimensions = getDayGridDimensions(stats.expectancyYears)
    const getBounds = vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 100,
      left: 100,
      top: 100,
      right: 100 + dimensions.width,
      bottom: 100 + DAY_GRID.cellHeight,
      width: dimensions.width,
      height: DAY_GRID.cellHeight,
      toJSON: () => {},
    })

    fireEvent.pointerEnter(canvas)
    fireEvent.pointerMove(canvas, {
      clientX: 100 + 0.5,
      clientY: 101,
    })
    fireEvent.pointerMove(canvas, {
      clientX: 100 + DAY_GRID.cellStepX + 0.5,
      clientY: 101,
    })

    expect(getBounds).toHaveBeenCalledTimes(1)
  })

  it("clears the tooltip and overlay when hovering a gap", async () => {
    render(<DayVisualization cells={cells} stats={stats} />)

    const canvas = screen.getByTestId("day-grid-canvas")
    const hoverOverlay = screen.getByTestId("day-cell-hover")
    const tooltip = screen.getByTestId("day-cell-tooltip")
    const dimensions = getDayGridDimensions(stats.expectancyYears)
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 100,
      left: 100,
      top: 100,
      right: 100 + dimensions.width,
      bottom: 100 + DAY_GRID.cellHeight,
      width: dimensions.width,
      height: DAY_GRID.cellHeight,
      toJSON: () => {},
    })

    fireEvent.pointerEnter(canvas)
    fireEvent.pointerMove(canvas, {
      clientX: 100 + 0.5,
      clientY: 101,
    })

    await waitFor(() => {
      expect(tooltip).toHaveAttribute("data-visible", "true")
    })

    fireEvent.pointerMove(canvas, {
      clientX: 100 + DAY_GRID.cellWidth + 0.1,
      clientY: 101,
    })

    expect(hoverOverlay).toHaveAttribute("data-visible", "false")
    expect(tooltip).toHaveAttribute("data-visible", "false")
  })
})
