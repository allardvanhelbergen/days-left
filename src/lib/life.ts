export type BiologicalSex = "male" | "female"
export type LifeModel = "fixed-365"
export type DayCellStatus = "past" | "today" | "future"

export type ParsedBirthDate =
  | { ok: true; iso: string }
  | { ok: false; message: string }

export interface LifeStatsInput {
  birthDateISO: string
  sex: BiologicalSex
  todayISO: string
  model: LifeModel
}

export interface LifeStats extends LifeStatsInput {
  expectancyYears: number
  totalDays: number
  elapsedDays: number
  futureDays: number
}

export interface DayCell {
  index: number
  row: number
  column: number
  dateISO: string
  status: DayCellStatus
}

export const DAYS_PER_YEAR = 365
const MS_PER_DAY = 86_400_000
const EXPECTANCY_YEARS: Record<BiologicalSex, number> = {
  male: 81,
  female: 85,
}

export function parseBirthDate(input: string): ParsedBirthDate {
  const trimmed = input.trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: false, message: "Use YYYY-MM-DD." }
  }

  const [year, month, day] = trimmed.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false, message: "Enter a real calendar date." }
  }

  return { ok: true, iso: trimmed }
}

export function calculateLifeStats(input: LifeStatsInput): LifeStats {
  const expectancyYears = EXPECTANCY_YEARS[input.sex]
  const totalDays = expectancyYears * DAYS_PER_YEAR
  const elapsedDays = daysBetween(input.birthDateISO, input.todayISO)

  return {
    ...input,
    expectancyYears,
    totalDays,
    elapsedDays,
    futureDays: totalDays - elapsedDays,
  }
}

export function buildDayCells(stats: LifeStats): DayCell[] {
  return Array.from({ length: stats.totalDays }, (_, index) => {
    const dateISO = addDays(stats.birthDateISO, index)

    return {
      index,
      row: Math.floor(index / DAYS_PER_YEAR),
      column: index % DAYS_PER_YEAR,
      dateISO,
      status: getCellStatus(dateISO, stats.todayISO),
    }
  })
}

export function getTodayISO(date = new Date()): string {
  return toISODate(
    new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
  )
}

function getCellStatus(dateISO: string, todayISO: string): DayCellStatus {
  if (dateISO < todayISO) {
    return "past"
  }

  if (dateISO === todayISO) {
    return "today"
  }

  return "future"
}

function daysBetween(startISO: string, endISO: string): number {
  return Math.round((toUTCDate(endISO).getTime() - toUTCDate(startISO).getTime()) / MS_PER_DAY)
}

function addDays(startISO: string, days: number): string {
  const date = toUTCDate(startISO)
  date.setUTCDate(date.getUTCDate() + days)
  return toISODate(date)
}

function toUTCDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
