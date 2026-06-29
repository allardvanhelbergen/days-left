import { describe, expect, it, vi } from "vitest"

import {
  DAY_GRID,
  DAY_GRID_PALETTE,
  drawDayGrid,
  getDayCellAtGridPoint,
  getDayCellRect,
  getDayGridDimensions,
  type DayGridPalette,
} from "@/components/day-grid-rendering"
import { DAYS_PER_YEAR, type DayCell } from "@/lib/life"

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

describe("day grid rendering helpers", () => {
  it("maps grid points to cells while ignoring gaps and out-of-bounds points", () => {
    expect(getDayCellAtGridPoint({ x: 0.5, y: 1 }, cells)?.dateISO).toBe(
      "2000-01-01",
    )
    expect(getDayCellAtGridPoint({ x: DAY_GRID.cellWidth + 0.1, y: 1 }, cells)).toBeNull()
    expect(getDayCellAtGridPoint({ x: -1, y: 1 }, cells)).toBeNull()
    expect(getDayCellAtGridPoint({ x: 0.5, y: -1 }, cells)).toBeNull()
    expect(
      getDayCellAtGridPoint({ x: 0.5, y: DAY_GRID.cellStepY + 1 }, cells),
    ).toBeNull()
  })

  it("maps row and column points to the matching day index", () => {
    const rowMappedCells = Array.from({ length: DAYS_PER_YEAR + 1 }, (_, index) => ({
      index,
      row: Math.floor(index / DAYS_PER_YEAR),
      column: index % DAYS_PER_YEAR,
      dateISO: `2000-01-${String((index % 31) + 1).padStart(2, "0")}`,
      status: "future" as const,
    }))

    expect(
      getDayCellAtGridPoint(
        { x: 0.5, y: DAY_GRID.cellStepY + 1 },
        rowMappedCells,
      )?.index,
    ).toBe(DAYS_PER_YEAR)
  })

  it("returns stable cell rectangles for overlay positioning", () => {
    expect(getDayCellRect(cells[2])).toEqual({
      x: DAY_GRID.cellStepX * 2,
      y: 0,
      width: DAY_GRID.cellWidth,
      height: DAY_GRID.cellHeight,
    })
  })

  it("draws fill-only status layers with distinct styles and today last", () => {
    const calls: Array<{
      op: string
      fillStyle?: string | CanvasGradient | CanvasPattern
      strokeStyle?: string | CanvasGradient | CanvasPattern
      globalAlpha?: number
      x?: number
    }> = []
    const context = createCanvasContextMock(calls)
    const palette: DayGridPalette = {
      ...DAY_GRID_PALETTE,
      pastFill: "past-fill",
      futureFill: "future-fill",
      todayFill: "today-fill",
    }

    drawDayGrid(context, cells, getDayGridDimensions(1), palette)

    const fillCalls = calls.filter((call) => call.op === "fillRect")
    expect(fillCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fillStyle: "past-fill", globalAlpha: 0.72 }),
        expect.objectContaining({ fillStyle: "future-fill", globalAlpha: 1 }),
        expect.objectContaining({ fillStyle: "today-fill", globalAlpha: 1 }),
      ]),
    )
    expect(fillCalls.at(-1)).toEqual(
      expect.objectContaining({ fillStyle: "today-fill" }),
    )
    expect(context.strokeRect).not.toHaveBeenCalled()
    expect(context.beginPath).not.toHaveBeenCalled()
    expect(context.stroke).not.toHaveBeenCalled()
  })
})

function createCanvasContextMock(
  calls: Array<{
    op: string
    fillStyle?: string | CanvasGradient | CanvasPattern
    strokeStyle?: string | CanvasGradient | CanvasPattern
    globalAlpha?: number
    x?: number
  }>,
) {
  const context = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    clearRect: vi.fn(),
    fillRect: vi.fn((x: number) => {
      calls.push({
        op: "fillRect",
        fillStyle: context.fillStyle,
        globalAlpha: context.globalAlpha,
        x,
      })
    }),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(() => {
      calls.push({
        op: "stroke",
        strokeStyle: context.strokeStyle,
        globalAlpha: context.globalAlpha,
      })
    }),
    save: vi.fn(),
    restore: vi.fn(),
  }

  return context as unknown as CanvasRenderingContext2D
}
