import * as d3 from "d3"

import { DAYS_PER_YEAR, type DayCell, type DayCellStatus } from "@/lib/life"

export const DAY_GRID = {
  cellWidth: 1,
  cellHeight: 5.8,
  gapX: 0.55,
  gapY: 1.8,
  cellStepX: 1.55,
  cellStepY: 7.6,
} as const

export interface DayGridDimensions {
  width: number
  height: number
}

export interface DayGridPoint {
  x: number
  y: number
}

export interface DayGridRect extends DayGridPoint {
  width: number
  height: number
}

export interface DayGridPalette {
  pastFill: string
  futureFill: string
  todayFill: string
}

export const DAY_GRID_PALETTE: DayGridPalette = {
  pastFill: "hsl(36 8% 86%)",
  futureFill: "hsl(40 28% 99%)",
  todayFill: "hsl(35 8% 20%)",
}

const STATUS_DRAW_ORDER: DayCellStatus[] = ["past", "future", "today"]

export function getDayGridDimensions(expectancyYears: number): DayGridDimensions {
  return {
    width:
      DAYS_PER_YEAR * DAY_GRID.cellWidth + (DAYS_PER_YEAR - 1) * DAY_GRID.gapX,
    height:
      expectancyYears * DAY_GRID.cellHeight +
      (expectancyYears - 1) * DAY_GRID.gapY,
  }
}

export function getDayCellRect(cell: DayCell): DayGridRect {
  return {
    x: cell.column * DAY_GRID.cellStepX,
    y: cell.row * DAY_GRID.cellStepY,
    width: DAY_GRID.cellWidth,
    height: DAY_GRID.cellHeight,
  }
}

export function getDayCellAtGridPoint(
  point: DayGridPoint,
  cells: DayCell[],
): DayCell | null {
  if (point.x < 0 || point.y < 0) {
    return null
  }

  const column = Math.floor(point.x / DAY_GRID.cellStepX)
  const row = Math.floor(point.y / DAY_GRID.cellStepY)
  const localX = point.x - column * DAY_GRID.cellStepX
  const localY = point.y - row * DAY_GRID.cellStepY

  if (
    column < 0 ||
    column >= DAYS_PER_YEAR ||
    localX > DAY_GRID.cellWidth ||
    localY > DAY_GRID.cellHeight
  ) {
    return null
  }

  const index = row * DAYS_PER_YEAR + column
  const cell = cells[index]

  if (!cell || cell.row !== row || cell.column !== column) {
    return null
  }

  return cell
}

export function createDayGridPalette(element: Element): DayGridPalette {
  const style = window.getComputedStyle(element)

  return {
    pastFill: readHslVar(style, "--life-past", DAY_GRID_PALETTE.pastFill),
    futureFill: readHslVar(style, "--life-future", DAY_GRID_PALETTE.futureFill),
    todayFill: readHslVar(style, "--life-today", DAY_GRID_PALETTE.todayFill),
  }
}

export function drawDayGrid(
  context: CanvasRenderingContext2D,
  cells: DayCell[],
  dimensions: DayGridDimensions,
  palette: DayGridPalette = DAY_GRID_PALETTE,
) {
  context.clearRect(0, 0, dimensions.width, dimensions.height)

  const cellsByStatus = d3.group(cells, (cell) => cell.status)

  for (const status of STATUS_DRAW_ORDER) {
    drawStatusCells(context, cellsByStatus.get(status) ?? [], status, palette)
  }
}

function drawStatusCells(
  context: CanvasRenderingContext2D,
  cells: DayCell[],
  status: DayCellStatus,
  palette: DayGridPalette,
) {
  if (cells.length === 0) {
    return
  }

  const style = getStatusStyle(status, palette)

  context.save()
  context.globalAlpha = style.alpha
  context.fillStyle = style.fill

  for (const cell of cells) {
    const rect = getDayCellRect(cell)
    context.fillRect(rect.x, rect.y, rect.width, rect.height)
  }

  context.restore()
}

function getStatusStyle(status: DayCellStatus, palette: DayGridPalette) {
  if (status === "past") {
    return {
      fill: palette.pastFill,
      alpha: 0.72,
    }
  }

  if (status === "today") {
    return {
      fill: palette.todayFill,
      alpha: 1,
    }
  }

  return {
    fill: palette.futureFill,
    alpha: 1,
  }
}

function readHslVar(
  style: CSSStyleDeclaration,
  variableName: string,
  fallback: string,
) {
  const value = style.getPropertyValue(variableName).trim()

  if (!value) {
    return fallback
  }

  return `hsl(${value})`
}
