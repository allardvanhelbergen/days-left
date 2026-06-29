import type { BiologicalSex } from "@/lib/life"
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface DateOfBirthFieldProps {
  id: string
  value: string
  error: string | null
  onChange: (value: string) => void
}

interface BiologicalSexFieldProps {
  idPrefix: string
  value: BiologicalSex | null
  onChange: (value: BiologicalSex) => void
}

export function DateOfBirthField({
  id,
  value,
  error,
  onChange,
}: DateOfBirthFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id} className="leading-5">
        Date of birth
      </FieldLabel>
      <Input
        id={id}
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        value={value}
        aria-invalid={Boolean(error)}
        autoComplete="bday"
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError>{error}</FieldError>
    </Field>
  )
}

export function BiologicalSexField({
  idPrefix,
  value,
  onChange,
}: BiologicalSexFieldProps) {
  const maleId = `${idPrefix}-male`
  const femaleId = `${idPrefix}-female`

  return (
    <FieldSet className="gap-3">
      <FieldLegend variant="label" className="mb-3">
        Biological sex
      </FieldLegend>
      <RadioGroup
        value={value ?? ""}
        onValueChange={(nextValue) => onChange(nextValue as BiologicalSex)}
        aria-label="Biological sex"
        className="gap-3"
      >
        <Field
          orientation="horizontal"
          data-selected={value === "male" ? "true" : undefined}
          className="life-radio-option gap-2"
        >
          <RadioGroupItem id={maleId} value="male" />
          <FieldLabel htmlFor={maleId} className="font-normal">
            Male
          </FieldLabel>
        </Field>
        <Field
          orientation="horizontal"
          data-selected={value === "female" ? "true" : undefined}
          className="life-radio-option gap-2"
        >
          <RadioGroupItem id={femaleId} value="female" />
          <FieldLabel htmlFor={femaleId} className="font-normal">
            Female
          </FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  )
}
