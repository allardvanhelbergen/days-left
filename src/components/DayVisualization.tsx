import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react"
import * as d3 from "d3"

import { DAYS_PER_YEAR, type DayCell, type LifeStats } from "@/lib/life"
import { cn } from "@/lib/utils"

interface DayVisualizationProps {
  cells: DayCell[]
  stats: LifeStats
}

interface HoveredCell {
  dateISO: string
  x: number
  y: number
}

const CELL_WIDTH = 1
const CELL_HEIGHT = 5.8
const GAP_X = 0.55
const GAP_Y = 1.8
const CELL_STEP_X = CELL_WIDTH + GAP_X
const CELL_STEP_Y = CELL_HEIGHT + GAP_Y
const PAST_CELL_PATTERN_ID = "past-cell-crosshatch"
const TOOLTIP_DELAY_MS = 120

export function DayVisualization({ cells, stats }: DayVisualizationProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const activeCellRef = useRef<SVGRectElement | null>(null)
  const activeDateRef = useRef<string | null>(null)
  const pendingTooltipRef = useRef<HoveredCell | null>(null)
  const tooltipTimeoutRef = useRef<number | null>(null)
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null)

  const dimensions = useMemo(() => {
    return {
      width: DAYS_PER_YEAR * CELL_WIDTH + (DAYS_PER_YEAR - 1) * GAP_X,
      height:
        stats.expectancyYears * CELL_HEIGHT +
        (stats.expectancyYears - 1) * GAP_Y,
    }
  }, [stats.expectancyYears])

  useEffect(() => {
    const svg = d3.select(svgRef.current)

    svg.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)

    const root = svg.select<SVGGElement>("g.day-grid")

    root
      .selectAll<SVGRectElement, DayCell>("rect.day-cell")
      .data(cells, (cell) => cell.index)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "day-cell")
            .attr("rx", 0.28),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("x", (cell) => cell.column * CELL_STEP_X)
      .attr("y", (cell) => cell.row * CELL_STEP_Y)
      .attr("width", CELL_WIDTH)
      .attr("height", CELL_HEIGHT)
      .attr("data-date", (cell) => cell.dateISO)
      .attr("data-status", (cell) => cell.status)
      .attr("data-hovered", (cell) =>
        cell.dateISO === activeDateRef.current ? "true" : null,
      )
      .attr("fill", getCellFill)
      .attr("stroke", getCellStroke)
      .attr("stroke-width", getCellStrokeWidth)
      .attr("opacity", getCellOpacity)
      .on("pointerenter pointermove pointerleave", null)
  }, [cells, dimensions.height, dimensions.width])

  useEffect(() => {
    return () => clearTooltipTimeout()
  }, [])

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const target = event.target

    if (!(target instanceof SVGElement)) {
      return
    }

    const cell = target.closest<SVGRectElement>("rect.day-cell")
    const bounds = wrapRef.current?.getBoundingClientRect()
    const dateISO = cell?.dataset.date

    if (!cell || !bounds || !dateISO) {
      clearHoverState()
      return
    }

    setActiveCell(cell)
    scheduleTooltip({
      dateISO,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })
  }

  function setActiveCell(cell: SVGRectElement) {
    if (activeCellRef.current === cell) {
      return
    }

    activeCellRef.current?.removeAttribute("data-hovered")
    cell.setAttribute("data-hovered", "true")
    activeCellRef.current = cell
  }

  function scheduleTooltip(nextHoveredCell: HoveredCell) {
    pendingTooltipRef.current = nextHoveredCell

    if (hoveredCell?.dateISO === nextHoveredCell.dateISO) {
      setHoveredCell(nextHoveredCell)
      return
    }

    if (activeDateRef.current === nextHoveredCell.dateISO) {
      return
    }

    clearTooltipTimeout()
    activeDateRef.current = nextHoveredCell.dateISO
    tooltipTimeoutRef.current = window.setTimeout(() => {
      setHoveredCell(pendingTooltipRef.current)
      tooltipTimeoutRef.current = null
    }, TOOLTIP_DELAY_MS)
  }

  function clearTooltipTimeout() {
    if (tooltipTimeoutRef.current) {
      window.clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = null
    }
  }

  function clearHoverState() {
    clearTooltipTimeout()
    activeCellRef.current?.removeAttribute("data-hovered")
    activeCellRef.current = null
    activeDateRef.current = null
    pendingTooltipRef.current = null
    setHoveredCell(null)
  }

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center px-5 pb-8 pt-44 opacity-0 sm:pl-72 sm:pr-12 sm:pt-8 md:pl-80",
        "animate-grid-reveal [animation-delay:120ms] motion-reduce:animate-none motion-reduce:opacity-100",
      )}
    >
      <div
        ref={wrapRef}
        className="relative max-h-[72vh] w-[min(88vw,40rem)] min-w-[18rem] sm:max-h-[82vh] sm:w-[min(56vw,42rem)]"
        style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
      >
        <svg
          ref={svgRef}
          data-testid="day-grid-svg"
          className="size-full overflow-visible"
          role="img"
          aria-label={`Life visualization with ${stats.totalDays.toLocaleString()} day cells.`}
          onPointerMove={handlePointerMove}
          onPointerLeave={clearHoverState}
        >
          <defs>
            <pattern
              id={PAST_CELL_PATTERN_ID}
              data-testid={PAST_CELL_PATTERN_ID}
              patternUnits="userSpaceOnUse"
              width={CELL_STEP_X}
              height={CELL_STEP_Y}
            >
              <rect
                width={CELL_WIDTH}
                height={CELL_HEIGHT}
                rx={0.28}
                fill="hsl(var(--life-past))"
              />
              <path
                d={`M0,0L${CELL_WIDTH},${CELL_HEIGHT}M${CELL_WIDTH},0L0,${CELL_HEIGHT}`}
                fill="none"
                stroke="hsl(var(--life-past-cross))"
                strokeLinecap="round"
                strokeWidth={0.12}
              />
            </pattern>
          </defs>
          <g className="day-grid" />
        </svg>
        {hoveredCell ? (
          <div
            className="pointer-events-none absolute animate-tooltip-reveal rounded-md border border-border/80 bg-popover/95 px-3 py-2 text-sm text-popover-foreground shadow-[0_14px_30px_hsl(var(--ring)/0.18),0_0_0_1px_hsl(var(--border)/0.36)]"
            style={{
              left: hoveredCell.x,
              top: hoveredCell.y,
              transform: "translate(-50%, calc(-100% - 0.75rem))",
            }}
          >
            {hoveredCell.dateISO}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function getCellFill(cell: DayCell): string {
  if (cell.status === "past") {
    return `url(#${PAST_CELL_PATTERN_ID})`
  }

  if (cell.status === "today") {
    return "hsl(var(--life-today))"
  }

  return "hsl(var(--life-future))"
}

function getCellStroke(cell: DayCell): string {
  if (cell.status === "past") {
    return "hsl(var(--life-past-border))"
  }

  if (cell.status === "today") {
    return "hsl(var(--life-today-border))"
  }

  return "hsl(var(--life-future-border))"
}

function getCellStrokeWidth(cell: DayCell): number {
  if (cell.status === "today") {
    return 0.62
  }

  if (cell.status === "future") {
    return 0.32
  }

  return 0.18
}

function getCellOpacity(cell: DayCell): number {
  return cell.status === "past" ? 0.72 : 1
}
