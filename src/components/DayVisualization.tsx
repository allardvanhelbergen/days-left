import {
  useEffect,
  useMemo,
  useRef,
  type PointerEvent,
} from "react"

import {
  createDayGridPalette,
  drawDayGrid,
  getDayCellAtGridPoint,
  getDayCellRect,
  getDayGridDimensions,
  type DayGridDimensions,
  type DayGridRect,
} from "@/components/day-grid-rendering"
import type { DayCell, LifeStats } from "@/lib/life"
import { cn } from "@/lib/utils"

interface DayVisualizationProps {
  cells: DayCell[]
  stats: LifeStats
}

interface HoverGeometry {
  canvasOffsetX: number
  canvasOffsetY: number
  canvasWidth: number
  canvasHeight: number
  scaleX: number
  scaleY: number
}

interface HoverRender {
  cell: DayCell
  overlayX: number
  overlayY: number
  overlayWidth: number
  overlayHeight: number
  tooltipX: number
  tooltipY: number
}

const statusLegendItems = [
  {
    label: "Past",
    className: "bg-[hsl(var(--life-past))] opacity-70 shadow-[0_0_0_1px_hsl(var(--border)/0.18)]",
  },
  {
    label: "Today",
    className: "bg-[hsl(var(--life-today))]",
  },
  {
    label: "Future",
    className: "bg-[hsl(var(--life-future))] shadow-[0_0_0_1px_hsl(var(--border)/0.18)]",
  },
] as const

export function DayVisualization({ cells, stats }: DayVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const hoverOverlayRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const hoverGeometryRef = useRef<HoverGeometry | null>(null)
  const activeCellIndexRef = useRef<number | null>(null)
  const pendingHoverRef = useRef<HoverRender | null>(null)
  const hoverFrameRef = useRef<number | null>(null)

  const dimensions = useMemo(
    () => getDayGridDimensions(stats.expectancyYears),
    [stats.expectancyYears],
  )

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    drawCanvas(canvas, cells, dimensions)

    let frameId: number | null = null
    const scheduleDraw = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null
        drawCanvas(canvas, cells, dimensions)
      })
    }

    const observer = new ResizeObserver(scheduleDraw)
    observer.observe(canvas)

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }

      observer.disconnect()
    }
  }, [cells, dimensions])

  useEffect(() => {
    return () => cancelHoverFrame()
  }, [])

  function handlePointerEnter(event: PointerEvent<HTMLCanvasElement>) {
    cacheHoverGeometry(event.currentTarget)
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const geometry =
      hoverGeometryRef.current ?? cacheHoverGeometry(event.currentTarget)

    if (!geometry) {
      clearHoverState()
      return
    }

    const gridPoint = {
      x: (event.clientX - geometry.canvasOffsetX) * geometry.scaleX,
      y: (event.clientY - geometry.canvasOffsetY) * geometry.scaleY,
    }
    const cell = getDayCellAtGridPoint(gridPoint, cells)

    if (!cell) {
      clearHoverState()
      return
    }

    if (activeCellIndexRef.current === cell.index) {
      return
    }

    activeCellIndexRef.current = cell.index
    scheduleHoverRender(createHoverRender(cell, geometry))
  }

  function cacheHoverGeometry(canvas: HTMLCanvasElement): HoverGeometry | null {
    const canvasBounds = canvas.getBoundingClientRect()
    const wrapBounds = wrapRef.current?.getBoundingClientRect()

    if (canvasBounds.width <= 0 || canvasBounds.height <= 0) {
      hoverGeometryRef.current = null
      return null
    }

    const geometry = {
      canvasOffsetX: canvasBounds.left,
      canvasOffsetY: canvasBounds.top,
      canvasWidth: canvasBounds.width,
      canvasHeight: canvasBounds.height,
      scaleX: dimensions.width / canvasBounds.width,
      scaleY: dimensions.height / canvasBounds.height,
      wrapOffsetX: canvasBounds.left - (wrapBounds?.left ?? canvasBounds.left),
      wrapOffsetY: canvasBounds.top - (wrapBounds?.top ?? canvasBounds.top),
    }

    hoverGeometryRef.current = geometry
    return geometry
  }

  function createHoverRender(
    cell: DayCell,
    geometry: HoverGeometry,
  ): HoverRender {
    const rect = getDayCellRect(cell)
    const overlayX = (rect.x / dimensions.width) * geometry.canvasWidth
    const overlayY = (rect.y / dimensions.height) * geometry.canvasHeight
    const overlayWidth = (rect.width / dimensions.width) * geometry.canvasWidth
    const overlayHeight =
      (rect.height / dimensions.height) * geometry.canvasHeight

    return {
      cell,
      overlayX,
      overlayY,
      overlayWidth,
      overlayHeight,
      tooltipX: overlayX + overlayWidth / 2,
      tooltipY: overlayY,
    }
  }

  function scheduleHoverRender(nextRender: HoverRender) {
    pendingHoverRef.current = nextRender

    if (hoverFrameRef.current !== null) {
      return
    }

    hoverFrameRef.current = window.requestAnimationFrame(() => {
      hoverFrameRef.current = null
      flushHoverRender()
    })
  }

  function flushHoverRender() {
    const nextRender = pendingHoverRef.current

    if (!nextRender) {
      return
    }

    updateHoverOverlay(nextRender)
    updateTooltip(nextRender)
  }

  function updateHoverOverlay(nextRender: HoverRender) {
    const hoverOverlay = hoverOverlayRef.current

    if (!hoverOverlay) {
      return
    }

    hoverOverlay.style.width = `${nextRender.overlayWidth}px`
    hoverOverlay.style.height = `${nextRender.overlayHeight}px`
    hoverOverlay.style.transform = `translate3d(${nextRender.overlayX}px, ${nextRender.overlayY}px, 0)`
    hoverOverlay.dataset.visible = "true"
  }

  function updateTooltip(nextRender: HoverRender) {
    const tooltip = tooltipRef.current

    if (!tooltip) {
      return
    }

    tooltip.textContent = nextRender.cell.dateISO
    tooltip.style.transform = `translate3d(${nextRender.tooltipX}px, ${nextRender.tooltipY}px, 0) translate(-50%, calc(-100% - 0.75rem))`
    tooltip.dataset.visible = "true"
    tooltip.setAttribute("aria-hidden", "false")
  }

  function cancelHoverFrame() {
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current)
      hoverFrameRef.current = null
    }
  }

  function clearHoverState() {
    cancelHoverFrame()

    if (hoverOverlayRef.current) {
      hoverOverlayRef.current.dataset.visible = "false"
    }

    if (tooltipRef.current) {
      tooltipRef.current.dataset.visible = "false"
      tooltipRef.current.setAttribute("aria-hidden", "true")
      tooltipRef.current.textContent = ""
    }

    activeCellIndexRef.current = null
    pendingHoverRef.current = null
    hoverGeometryRef.current = null
  }

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center px-5 pb-8 pt-44 opacity-0 sm:pl-72 sm:pr-12 sm:pt-8 md:pl-80",
        "animate-grid-reveal [animation-delay:120ms] motion-reduce:animate-none motion-reduce:opacity-100",
      )}
    >
      <div
        data-testid="day-status-legend"
        aria-label="Day cell status legend"
        className="pointer-events-none absolute bottom-5 left-5 z-10 flex flex-col gap-1.5 text-xs font-medium leading-none text-foreground/90 sm:bottom-8 sm:left-8"
      >
        {statusLegendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              data-testid="day-status-swatch"
              className={cn("block size-3 rounded-[2px]", item.className)}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="mt-3 flex flex-col gap-1 text-[0.68rem] font-normal leading-snug text-foreground/70">
          <span>
            Inspired by{" "}
            <a
              href="https://xkcd.com/1577/"
              target="_blank"
              rel="noreferrer"
              className="pointer-events-auto underline underline-offset-2 transition-colors hover:text-foreground"
            >
              xkcd.com/1577
            </a>
          </span>
          <span>Created by Allard van Helbergen</span>
        </div>
      </div>
      <div
        ref={wrapRef}
        className="relative max-h-[72vh] w-[min(88vw,40rem)] min-w-[18rem] sm:max-h-[82vh] sm:w-[min(56vw,42rem)]"
        style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
      >
        <canvas
          ref={canvasRef}
          data-testid="day-grid-canvas"
          className="block size-full"
          role="img"
          aria-label={`Life visualization with ${stats.totalDays.toLocaleString()} day cells.`}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={clearHoverState}
        />
        <div
          ref={hoverOverlayRef}
          data-testid="day-cell-hover"
          data-visible="false"
          className="pointer-events-none absolute left-0 top-0 rounded-[1px] border border-[hsl(var(--life-today-border))] bg-popover/35 opacity-0 shadow-[0_0_0_1px_hsl(var(--popover)/0.7)] transition-opacity duration-75 will-change-transform data-[visible=true]:opacity-100"
        />
        <div
          ref={tooltipRef}
          data-testid="day-cell-tooltip"
          data-visible="false"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 flex h-8 w-[7.5rem] items-center justify-center whitespace-nowrap rounded-md border border-border/80 bg-popover/95 px-3 text-sm tabular-nums text-popover-foreground opacity-0 shadow-[0_10px_22px_hsl(var(--ring)/0.14),0_0_0_1px_hsl(var(--border)/0.36)] transition-opacity duration-75 will-change-transform data-[visible=true]:opacity-100"
        />
      </div>
    </div>
  )
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  cells: DayCell[],
  dimensions: DayGridDimensions,
) {
  const context = canvas.getContext("2d")

  if (!context) {
    return
  }

  const bounds = canvas.getBoundingClientRect()
  const cssWidth = bounds.width || dimensions.width
  const cssHeight = bounds.height || dimensions.height
  const devicePixelRatio = window.devicePixelRatio || 1
  const nextWidth = Math.max(1, Math.round(cssWidth * devicePixelRatio))
  const nextHeight = Math.max(1, Math.round(cssHeight * devicePixelRatio))

  if (canvas.width !== nextWidth) {
    canvas.width = nextWidth
  }

  if (canvas.height !== nextHeight) {
    canvas.height = nextHeight
  }

  context.setTransform(
    (cssWidth / dimensions.width) * devicePixelRatio,
    0,
    0,
    (cssHeight / dimensions.height) * devicePixelRatio,
    0,
    0,
  )
  drawDayGrid(context, cells, dimensions, createDayGridPalette(canvas))
}
