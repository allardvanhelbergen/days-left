import { useEffect, useMemo, useRef, useState } from "react"
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

export function DayVisualization({ cells, stats }: DayVisualizationProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

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
            .attr("x", (cell) => cell.column * CELL_STEP_X)
            .attr("y", (cell) => cell.row * CELL_STEP_Y)
            .attr("width", CELL_WIDTH)
            .attr("height", CELL_HEIGHT)
            .attr("rx", 0.28)
            .attr("opacity", 0)
            .call((selection) =>
              selection
                .transition()
                .duration(reducedMotion ? 0 : 520)
                .delay((_, index) => (reducedMotion ? 0 : Math.min(index * 0.18, 520)))
                .attr("opacity", 1),
            ),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("x", (cell) => cell.column * CELL_STEP_X)
      .attr("y", (cell) => cell.row * CELL_STEP_Y)
      .attr("width", CELL_WIDTH)
      .attr("height", CELL_HEIGHT)
      .attr("data-date", (cell) => cell.dateISO)
      .attr("data-status", (cell) => cell.status)
      .attr("fill", (cell) => {
        if (cell.status === "past") {
          return "hsl(var(--life-past))"
        }

        if (cell.status === "today") {
          return "hsl(var(--life-today))"
        }

        return "hsl(var(--life-future))"
      })
      .attr("stroke", (cell) =>
        cell.status === "today"
          ? "hsl(var(--life-today-border))"
          : "hsl(var(--life-cell-border))",
      )
      .attr("stroke-width", (cell) => (cell.status === "today" ? 0.42 : 0.24))
      .on("pointerenter pointermove", (event, cell) => {
        const bounds = wrapRef.current?.getBoundingClientRect()

        if (!bounds) {
          return
        }

        setHoveredCell({
          dateISO: cell.dateISO,
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        })
      })
      .on("pointerleave", () => setHoveredCell(null))

    root
      .selectAll<SVGPathElement, DayCell>("path.past-crosses")
      .data([cells.filter((cell) => cell.status === "past")])
      .join("path")
      .attr("class", "past-crosses")
      .attr("d", getPastCrossPath)
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--life-cross))")
      .attr("stroke-width", 0.12)
      .attr("stroke-linecap", "round")
      .attr("opacity", 0.55)
      .attr("pointer-events", "none")
  }, [cells, dimensions.height, dimensions.width])

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center px-5 pb-8 pt-44 opacity-0 sm:pl-72 sm:pr-12 sm:pt-8 md:pl-80",
        "animate-grid-reveal motion-reduce:animate-none motion-reduce:opacity-100",
      )}
    >
      <div
        ref={wrapRef}
        className="relative max-h-[72vh] w-[min(88vw,40rem)] min-w-[18rem] sm:max-h-[82vh] sm:w-[min(56vw,42rem)]"
        style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
      >
        <svg
          ref={svgRef}
          className="size-full overflow-visible"
          role="img"
          aria-label={`Life visualization with ${stats.totalDays.toLocaleString()} day cells.`}
        >
          <g className="day-grid" />
        </svg>
        {hoveredCell ? (
          <div
            className="pointer-events-none absolute rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm"
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

function getPastCrossPath(cells: DayCell[]): string {
  return cells
    .map((cell) => {
      const x = cell.column * CELL_STEP_X
      const y = cell.row * CELL_STEP_Y
      const x2 = x + CELL_WIDTH
      const y2 = y + CELL_HEIGHT

      return `M${x.toFixed(2)},${y.toFixed(2)}L${x2.toFixed(2)},${y2.toFixed(2)}M${x2.toFixed(2)},${y.toFixed(2)}L${x.toFixed(2)},${y2.toFixed(2)}`
    })
    .join("")
}
