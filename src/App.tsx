import { useEffect, useMemo, useState } from "react"

import { DayVisualization } from "@/components/DayVisualization"
import { EditorForm } from "@/components/EditorForm"
import { OnboardingForm } from "@/components/OnboardingForm"
import {
  buildDayCells,
  calculateLifeStats,
  getTodayISO,
  parseBirthDate,
  type BiologicalSex,
} from "@/lib/life"

interface SubmittedInput {
  birthDateISO: string
  sex: BiologicalSex
}

export const EDITOR_DEBOUNCE_MS = 350
export const ONBOARDING_REVEAL_DELAY_MS = 250

interface AppProps {
  editorDebounceMs?: number
  onboardingRevealDelayMs?: number
}

export default function App({
  editorDebounceMs = EDITOR_DEBOUNCE_MS,
  onboardingRevealDelayMs = ONBOARDING_REVEAL_DELAY_MS,
}: AppProps = {}) {
  const [birthDate, setBirthDate] = useState("")
  const [sex, setSex] = useState<BiologicalSex | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeInput, setActiveInput] = useState<SubmittedInput | null>(null)

  const parsedBirthDate = useMemo(() => parseBirthDate(birthDate), [birthDate])
  const dateIsValid = parsedBirthDate.ok

  const stats = useMemo(() => {
    if (!activeInput) {
      return null
    }

    return calculateLifeStats({
      birthDateISO: activeInput.birthDateISO,
      sex: activeInput.sex,
      todayISO: getTodayISO(),
      model: "fixed-365",
    })
  }, [activeInput])

  const cells = useMemo(() => (stats ? buildDayCells(stats) : []), [stats])

  const hasActiveInput = Boolean(activeInput)

  useEffect(() => {
    if (!hasActiveInput) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const parsed = parseBirthDate(birthDate)

      if (!parsed.ok) {
        setError(parsed.message)
        return
      }

      if (!sex) {
        return
      }

      setError(null)
      setActiveInput((current) => {
        if (current?.birthDateISO === parsed.iso && current.sex === sex) {
          return current
        }

        return { birthDateISO: parsed.iso, sex }
      })
    }, editorDebounceMs)

    return () => window.clearTimeout(timeoutId)
  }, [birthDate, editorDebounceMs, hasActiveInput, sex])

  function handleBirthDateChange(value: string) {
    setBirthDate(value)

    if (!activeInput) {
      setError(null)
    }
  }

  function handleSubmit() {
    const parsed = parseBirthDate(birthDate)

    if (!parsed.ok) {
      setError(parsed.message)
      return
    }

    if (!sex) {
      return
    }

    setError(null)
    setActiveInput({ birthDateISO: parsed.iso, sex })
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 app-gradient" aria-hidden="true" />
      <OnboardingForm
        birthDate={birthDate}
        sex={sex}
        dateIsValid={dateIsValid}
        submitted={Boolean(activeInput)}
        revealDelayMs={onboardingRevealDelayMs}
        onBirthDateChange={handleBirthDateChange}
        onSexChange={setSex}
        onSubmit={handleSubmit}
      />
      {activeInput ? (
        <EditorForm
          birthDate={birthDate}
          sex={sex ?? activeInput.sex}
          error={error}
          onBirthDateChange={handleBirthDateChange}
          onSexChange={setSex}
        />
      ) : null}
      {stats ? <DayVisualization cells={cells} stats={stats} /> : null}
    </main>
  )
}
