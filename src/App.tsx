import { useMemo, useState } from "react"

import { DayVisualization } from "@/components/DayVisualization"
import { LifeForm } from "@/components/LifeForm"
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

export default function App() {
  const [birthDate, setBirthDate] = useState("")
  const [sex, setSex] = useState<BiologicalSex>("male")
  const [error, setError] = useState<string | null>(null)
  const [submittedInput, setSubmittedInput] = useState<SubmittedInput | null>(null)

  const stats = useMemo(() => {
    if (!submittedInput) {
      return null
    }

    return calculateLifeStats({
      birthDateISO: submittedInput.birthDateISO,
      sex: submittedInput.sex,
      todayISO: getTodayISO(),
      model: "fixed-365",
    })
  }, [submittedInput])

  const cells = useMemo(() => (stats ? buildDayCells(stats) : []), [stats])

  function handleSubmit() {
    const parsed = parseBirthDate(birthDate)

    if (!parsed.ok) {
      setError(parsed.message)
      return
    }

    setError(null)
    setSubmittedInput({ birthDateISO: parsed.iso, sex })
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 app-gradient" aria-hidden="true" />
      <LifeForm
        birthDate={birthDate}
        sex={sex}
        error={error}
        submitted={Boolean(submittedInput)}
        onBirthDateChange={setBirthDate}
        onSexChange={setSex}
        onSubmit={handleSubmit}
      />
      {stats ? <DayVisualization cells={cells} stats={stats} /> : null}
    </main>
  )
}
