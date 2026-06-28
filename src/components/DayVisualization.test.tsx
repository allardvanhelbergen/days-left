import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DayVisualization } from "@/components/DayVisualization"
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
  it("renders cells at final opacity without a per-cell reveal setup", async () => {
    render(<DayVisualization cells={cells} stats={stats} />)

    await waitFor(() => {
      expect(document.querySelectorAll("rect.day-cell")).toHaveLength(cells.length)
    })

    for (const cell of document.querySelectorAll("rect.day-cell")) {
      expect(cell).not.toHaveAttribute("opacity", "0")
    }
  })

  it("uses lower-prominence past styling and stronger future/today styling", async () => {
    render(<DayVisualization cells={cells} stats={stats} />)

    await waitFor(() => {
      expect(document.querySelectorAll("rect.day-cell")).toHaveLength(cells.length)
    })

    const pastCell = document.querySelector('rect[data-status="past"]')
    const todayCell = document.querySelector('rect[data-status="today"]')
    const futureCell = document.querySelector('rect[data-status="future"]')

    expect(screen.getByTestId("past-cell-crosshatch")).toBeInTheDocument()
    expect(document.querySelector("path.past-crosses")).not.toBeInTheDocument()
    expect(pastCell).toHaveAttribute("fill", "url(#past-cell-crosshatch)")
    expect(pastCell).toHaveAttribute("stroke", "hsl(var(--life-past-border))")
    expect(pastCell).toHaveAttribute("opacity", "0.72")
    expect(futureCell).toHaveAttribute("fill", "hsl(var(--life-future))")
    expect(futureCell).toHaveAttribute("stroke", "hsl(var(--life-future-border))")
    expect(futureCell).toHaveAttribute("opacity", "1")
    expect(todayCell).toHaveAttribute("fill", "hsl(var(--life-today))")
    expect(todayCell).toHaveAttribute("stroke", "hsl(var(--life-today-border))")
    expect(todayCell).toHaveAttribute("opacity", "1")
  })

  it("shows and clears a tooltip through delegated SVG hover handling", async () => {
    render(<DayVisualization cells={cells} stats={stats} />)

    await waitFor(() => {
      expect(document.querySelectorAll("rect.day-cell")).toHaveLength(cells.length)
    })

    const futureCell = document.querySelector('rect[data-date="2000-01-03"]')
    expect(futureCell).not.toBeNull()

    fireEvent.pointerMove(futureCell as Element, {
      clientX: 120,
      clientY: 140,
    })

    expect(screen.getByText("2000-01-03")).toBeInTheDocument()

    fireEvent.pointerLeave(screen.getByTestId("day-grid-svg"))

    expect(screen.queryByText("2000-01-03")).not.toBeInTheDocument()
  })
})
