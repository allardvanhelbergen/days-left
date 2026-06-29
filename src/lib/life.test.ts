import { describe, expect, it } from "vitest"
import {
  buildDayCells,
  calculateLifeStats,
  formatBirthDateDisplayInput,
  parseDisplayBirthDate,
  parseBirthDate,
  toDisplayBirthDate,
  type DayCellStatus,
} from "./life"

describe("parseBirthDate", () => {
  it("accepts valid year-first dates", () => {
    expect(parseBirthDate("1990-05-14")).toEqual({
      ok: true,
      iso: "1990-05-14",
    })
  })

  it("rejects non year-first input", () => {
    expect(parseBirthDate("05-14-1990")).toEqual({
      ok: false,
      message: "Use YYYY-MM-DD.",
    })
  })

  it("rejects impossible calendar dates", () => {
    expect(parseBirthDate("1990-02-31")).toEqual({
      ok: false,
      message: "Enter a real calendar date.",
    })
  })
})

describe("display birth dates", () => {
  it("formats typed digits as DD-MM-YYYY", () => {
    expect(formatBirthDateDisplayInput("12051990")).toBe("12-05-1990")
    expect(formatBirthDateDisplayInput("12-05-1990")).toBe("12-05-1990")
    expect(formatBirthDateDisplayInput("120")).toBe("12-0")
    expect(formatBirthDateDisplayInput("12051990123")).toBe("12-05-1990")
  })

  it("parses valid display dates into ISO dates", () => {
    expect(parseDisplayBirthDate("12-05-1990")).toEqual({
      ok: true,
      iso: "1990-05-12",
    })
  })

  it("rejects non-display-format and impossible display dates", () => {
    expect(parseDisplayBirthDate("1990-05-12")).toEqual({
      ok: false,
      message: "Use DD-MM-YYYY.",
    })
    expect(parseDisplayBirthDate("31-02-1990")).toEqual({
      ok: false,
      message: "Enter a real calendar date.",
    })
  })

  it("converts ISO dates into display dates", () => {
    expect(toDisplayBirthDate("1990-05-12")).toBe("12-05-1990")
  })
})

describe("calculateLifeStats", () => {
  it("uses fixed 365-day expectancy totals for male and female", () => {
    expect(
      calculateLifeStats({
        birthDateISO: "2000-01-01",
        sex: "male",
        todayISO: "2000-01-01",
        model: "fixed-365",
      }).totalDays,
    ).toBe(29_565)

    expect(
      calculateLifeStats({
        birthDateISO: "2000-01-01",
        sex: "female",
        todayISO: "2000-01-01",
        model: "fixed-365",
      }).totalDays,
    ).toBe(31_025)
  })

  it("calculates elapsed and future days from injected today", () => {
    expect(
      calculateLifeStats({
        birthDateISO: "2000-01-01",
        sex: "male",
        todayISO: "2000-01-11",
        model: "fixed-365",
      }),
    ).toMatchObject({
      elapsedDays: 10,
      futureDays: 29_555,
      expectancyYears: 81,
    })
  })

  it("allows future birth dates", () => {
    expect(
      calculateLifeStats({
        birthDateISO: "2030-01-01",
        sex: "female",
        todayISO: "2029-12-30",
        model: "fixed-365",
      }),
    ).toMatchObject({
      elapsedDays: -2,
      futureDays: 31_027,
    })
  })

  it("allows dates beyond selected expectancy", () => {
    expect(
      calculateLifeStats({
        birthDateISO: "1900-01-01",
        sex: "male",
        todayISO: "1982-01-01",
        model: "fixed-365",
      }),
    ).toMatchObject({
      elapsedDays: 29_950,
      futureDays: -385,
    })
  })
})

describe("buildDayCells", () => {
  it("creates one cell per expected day with strict 365-column rows", () => {
    const cells = buildDayCells(
      calculateLifeStats({
        birthDateISO: "2000-01-01",
        sex: "male",
        todayISO: "2000-01-01",
        model: "fixed-365",
      }),
    )

    expect(cells).toHaveLength(29_565)
    expect(cells[0]).toMatchObject({
      index: 0,
      row: 0,
      column: 0,
      dateISO: "2000-01-01",
      status: "today" satisfies DayCellStatus,
    })
    expect(cells[364]).toMatchObject({
      index: 364,
      row: 0,
      column: 364,
      dateISO: "2000-12-30",
    })
    expect(cells[365]).toMatchObject({
      index: 365,
      row: 1,
      column: 0,
      dateISO: "2000-12-31",
    })
  })

  it("classifies cells as past, today, and future", () => {
    const cells = buildDayCells(
      calculateLifeStats({
        birthDateISO: "2000-01-01",
        sex: "male",
        todayISO: "2000-01-03",
        model: "fixed-365",
      }),
    )

    expect(cells[0]?.status).toBe("past")
    expect(cells[1]?.status).toBe("past")
    expect(cells[2]?.status).toBe("today")
    expect(cells[3]?.status).toBe("future")
  })

  it("renders all cells as future for future birth dates", () => {
    const cells = buildDayCells(
      calculateLifeStats({
        birthDateISO: "2030-01-01",
        sex: "male",
        todayISO: "2029-12-31",
        model: "fixed-365",
      }),
    )

    expect(new Set(cells.map((cell) => cell.status))).toEqual(new Set(["future"]))
  })

  it("renders all cells as past for over-expectancy dates", () => {
    const cells = buildDayCells(
      calculateLifeStats({
        birthDateISO: "1900-01-01",
        sex: "male",
        todayISO: "1982-01-01",
        model: "fixed-365",
      }),
    )

    expect(new Set(cells.map((cell) => cell.status))).toEqual(new Set(["past"]))
  })
})
