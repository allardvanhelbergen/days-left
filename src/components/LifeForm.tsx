import type { FormEvent } from "react"

import type { BiologicalSex } from "@/lib/life"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface LifeFormProps {
  birthDate: string
  sex: BiologicalSex
  error: string | null
  submitted: boolean
  onBirthDateChange: (value: string) => void
  onSexChange: (value: BiologicalSex) => void
  onSubmit: () => void
}

export function LifeForm({
  birthDate,
  sex,
  error,
  submitted,
  onBirthDateChange,
  onSexChange,
  onSubmit,
}: LifeFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      className={cn(
        "absolute z-10 w-[min(14rem,calc(100vw-2rem))] transition-all duration-700 ease-out motion-reduce:duration-0",
        submitted
          ? "left-4 top-4 translate-x-0 translate-y-0 sm:left-8 sm:top-8"
          : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
      )}
      onSubmit={handleSubmit}
    >
      <FieldGroup className="gap-5">
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="birth-date" className="leading-5">
            Date of birth
          </FieldLabel>
          <Input
            id="birth-date"
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
            value={birthDate}
            aria-invalid={Boolean(error)}
            autoComplete="bday"
            onChange={(event) => onBirthDateChange(event.target.value)}
          />
          <FieldError>{error}</FieldError>
        </Field>

        <FieldSet className="gap-3">
          <FieldLegend variant="label" className="mb-3">
            Biological sex
          </FieldLegend>
          <RadioGroup
            value={sex}
            onValueChange={(value) => onSexChange(value as BiologicalSex)}
            aria-label="Biological sex"
            className="gap-3"
          >
            <Field orientation="horizontal" className="gap-2">
              <RadioGroupItem id="male" value="male" />
              <FieldLabel htmlFor="male" className="font-normal">
                Male
              </FieldLabel>
            </Field>
            <Field orientation="horizontal" className="gap-2">
              <RadioGroupItem id="female" value="female" />
              <FieldLabel htmlFor="female" className="font-normal">
                Female
              </FieldLabel>
            </Field>
          </RadioGroup>
        </FieldSet>

        <Button type="submit" className="w-fit">
          Show days
        </Button>
      </FieldGroup>
    </form>
  )
}
