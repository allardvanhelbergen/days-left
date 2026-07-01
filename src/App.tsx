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

interface UrlLifeInputState {
  birthDate: string
  sex: BiologicalSex | null
  activeInput: SubmittedInput | null
}

export const EDITOR_DEBOUNCE_MS = 350
export const ONBOARDING_REVEAL_DELAY_MS = 250

const BIRTH_DATE_SEARCH_PARAM = "dob"
const SEX_SEARCH_PARAM = "sex"

interface AppProps {
  editorDebounceMs?: number
  onboardingRevealDelayMs?: number
}

export default function App({
  editorDebounceMs = EDITOR_DEBOUNCE_MS,
  onboardingRevealDelayMs = ONBOARDING_REVEAL_DELAY_MS,
}: AppProps = {}) {
  const initialUrlState = useMemo(readLifeInputStateFromUrl, [])
  const [birthDate, setBirthDate] = useState(initialUrlState.birthDate)
  const [sex, setSex] = useState<BiologicalSex | null>(initialUrlState.sex)
  const [error, setError] = useState<string | null>(null)
  const [activeInput, setActiveInput] = useState<SubmittedInput | null>(
    initialUrlState.activeInput,
  )

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
    if (!activeInput) {
      return
    }

    writeLifeInputStateToUrl(activeInput)
  }, [activeInput])

  useEffect(() => {
    function handlePopState() {
      const nextUrlState = readLifeInputStateFromUrl()

      setBirthDate(nextUrlState.birthDate)
      setSex(nextUrlState.sex)
      setError(null)
      setActiveInput(nextUrlState.activeInput)
    }

    window.addEventListener("popstate", handlePopState)

    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

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

function readLifeInputStateFromUrl(): UrlLifeInputState {
  if (typeof window === "undefined") {
    return { birthDate: "", sex: null, activeInput: null }
  }

  const params = new URLSearchParams(window.location.search)
  const parsedBirthDate = parseBirthDate(
    params.get(BIRTH_DATE_SEARCH_PARAM) ?? "",
  )
  const sex = parseBiologicalSex(params.get(SEX_SEARCH_PARAM))
  const birthDate = parsedBirthDate.ok ? parsedBirthDate.iso : ""

  return {
    birthDate,
    sex,
    activeInput:
      parsedBirthDate.ok && sex
        ? { birthDateISO: parsedBirthDate.iso, sex }
        : null,
  }
}

function writeLifeInputStateToUrl(input: SubmittedInput) {
  if (typeof window === "undefined") {
    return
  }

  const params = new URLSearchParams(window.location.search)
  params.set(BIRTH_DATE_SEARCH_PARAM, input.birthDateISO)
  params.set(SEX_SEARCH_PARAM, input.sex)

  const nextSearch = params.toString()
  const nextUrl = [
    window.location.pathname,
    nextSearch ? `?${nextSearch}` : "",
    window.location.hash,
  ].join("")
  const currentUrl = [
    window.location.pathname,
    window.location.search,
    window.location.hash,
  ].join("")

  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, "", nextUrl)
  }
}

function parseBiologicalSex(value: string | null): BiologicalSex | null {
  if (value === "male" || value === "female") {
    return value
  }

  return null
}
