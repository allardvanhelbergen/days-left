import type { FormEvent } from "react"

import type { BiologicalSex } from "@/lib/life"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import {
  BiologicalSexField,
  DateOfBirthField,
} from "@/components/LifeFormFields"

interface OnboardingFormProps {
  birthDate: string
  sex: BiologicalSex | null
  error: string | null
  dateIsValid: boolean
  submitted: boolean
  onBirthDateChange: (value: string) => void
  onSexChange: (value: BiologicalSex) => void
  onSubmit: () => void
}

export function OnboardingForm({
  birthDate,
  sex,
  error,
  dateIsValid,
  submitted,
  onBirthDateChange,
  onSexChange,
  onSubmit,
}: OnboardingFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      data-testid="onboarding-form"
      aria-hidden={submitted}
      className={cn(
        "absolute left-1/2 top-1/2 z-10 w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ease-out motion-reduce:duration-0",
        submitted ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      onSubmit={handleSubmit}
    >
      <FieldGroup className="gap-5">
        <DateOfBirthField
          id="onboarding-birth-date"
          value={birthDate}
          error={error}
          onChange={onBirthDateChange}
        />

        {dateIsValid ? (
          <div className="animate-question-reveal">
            <BiologicalSexField
              idPrefix="onboarding"
              value={sex}
              onChange={onSexChange}
            />
          </div>
        ) : null}

        {dateIsValid && sex ? (
          <Button type="submit" className="w-fit animate-question-reveal">
            Show days
          </Button>
        ) : null}
      </FieldGroup>
    </form>
  )
}
