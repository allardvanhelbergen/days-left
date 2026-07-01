import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("form interaction state prominence", () => {
  it("makes radio hover states more prominent than selected states", () => {
    const css = readFileSync("src/index.css", "utf8")
    const radioSource = readFileSync("src/components/ui/radio-group.tsx", "utf8")
    const optionHover = extractCssRule(css, ".life-radio-option:hover")
    const optionSelected = extractCssRule(
      css,
      '.life-radio-option[data-selected="true"]',
    )
    const optionSelectedHover = extractCssRule(
      css,
      '.life-radio-option[data-selected="true"]:hover',
    )

    expect(optionHover).toContain("scale(1.01)")
    expect(optionSelected).not.toContain("scale(")
    expect(optionSelected).not.toContain("box-shadow")
    expect(optionSelected).not.toContain("border-color")
    expect(optionSelectedHover).toContain("box-shadow: none")
    expect(optionSelectedHover).toContain("translateY(-0.5px)")

    expect(maxClassRingAlpha(radioSource, "hover:shadow-")).toBeGreaterThan(
      maxClassRingAlpha(radioSource, "data-[state=checked]:shadow-"),
    )
  })

  it("keeps checked radio circles visually selected when hovered", () => {
    const radioSource = readFileSync("src/components/ui/radio-group.tsx", "utf8")

    expect(radioSource).toContain("data-[state=checked]:hover:scale-100")
    expect(maxClassRingAlpha(radioSource, "data-[state=checked]:hover:shadow-")).toBe(
      maxClassRingAlpha(radioSource, "data-[state=checked]:shadow-"),
    )
  })
})

function extractCssRule(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]+)\\}`))

  if (!match?.groups?.body) {
    throw new Error(`Unable to find CSS rule for ${selector}`)
  }

  return match.groups.body
}

function maxRingAlpha(source: string) {
  return Math.max(
    ...Array.from(source.matchAll(/var\(--ring\)\s*\/\s*(0?\.\d+)/g)).map(
      (match) => Number(match[1]),
    ),
  )
}

function maxClassRingAlpha(source: string, classPrefix: string) {
  const escapedPrefix = classPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const classMatch = source.match(
    new RegExp(`${escapedPrefix}\\[[^\\]]*var\\(--ring\\)\\/([0-9.]+)[^\\]]*\\]`),
  )

  if (!classMatch) {
    throw new Error(`Unable to find ${classPrefix} ring shadow`)
  }

  return Number(classMatch[1])
}
