import { useEffect, useState } from "react"

import {
  formatBirthDateDisplayInput,
  parseDisplayBirthDate,
  toDisplayBirthDate,
} from "@/lib/life"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface OnboardingDateFieldProps {
  id: string
  birthDateISO: string
  onBirthDateChange: (value: string) => void
}

export function OnboardingDateField({
  id,
  birthDateISO,
  onBirthDateChange,
}: OnboardingDateFieldProps) {
  const [displayValue, setDisplayValue] = useState(() =>
    toDisplayBirthDate(birthDateISO),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!birthDateISO) {
      return
    }

    const nextDisplayValue = toDisplayBirthDate(birthDateISO)
    setDisplayValue(nextDisplayValue)
  }, [birthDateISO])

  function handleInputChange(value: string) {
    const formatted = formatBirthDateDisplayInput(value)
    setDisplayValue(formatted)

    if (formatted.length < 10) {
      setError(null)
      onBirthDateChange("")
      return
    }

    const parsed = parseDisplayBirthDate(formatted)

    if (!parsed.ok) {
      setError(parsed.message)
      onBirthDateChange("")
      return
    }

    setError(null)
    onBirthDateChange(parsed.iso)
  }

  return (
    <Field data-invalid={Boolean(error)} className="items-center text-center">
      <FieldLabel
        htmlFor={id}
        className="justify-center text-center text-2xl leading-8"
      >
        I was born on
      </FieldLabel>
      <Input
        id={id}
        inputMode="numeric"
        placeholder="DD-MM-YYYY"
        value={displayValue}
        aria-invalid={Boolean(error)}
        autoComplete="bday"
        className="h-14 w-72 text-center text-2xl md:text-2xl"
        onChange={(event) => handleInputChange(event.target.value)}
      />
      <FieldError className="text-base">{error}</FieldError>
    </Field>
  )
}
