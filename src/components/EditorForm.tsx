import type { BiologicalSex } from "@/lib/life"
import { FieldGroup } from "@/components/ui/field"
import {
  BiologicalSexField,
  DateOfBirthField,
} from "@/components/LifeFormFields"

interface EditorFormProps {
  birthDate: string
  sex: BiologicalSex
  error: string | null
  onBirthDateChange: (value: string) => void
  onSexChange: (value: BiologicalSex) => void
}

export function EditorForm({
  birthDate,
  sex,
  error,
  onBirthDateChange,
  onSexChange,
}: EditorFormProps) {
  return (
    <form
      data-testid="editor-form"
      className="absolute left-4 top-4 z-10 w-[min(14rem,calc(100vw-2rem))] animate-question-reveal sm:left-8 sm:top-8"
      onSubmit={(event) => event.preventDefault()}
    >
      <FieldGroup className="gap-5">
        <DateOfBirthField
          id="editor-birth-date"
          value={birthDate}
          error={error}
          onChange={onBirthDateChange}
        />
        <BiologicalSexField
          idPrefix="editor"
          value={sex}
          onChange={onSexChange}
        />
      </FieldGroup>
    </form>
  )
}
