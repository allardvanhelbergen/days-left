import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"

import type { BiologicalSex } from "@/lib/life"
import { cn } from "@/lib/utils"
import { OnboardingDateField } from "@/components/OnboardingDateField"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface OnboardingFormProps {
  birthDate: string
  sex: BiologicalSex | null
  dateIsValid: boolean
  submitted: boolean
  revealDelayMs: number
  onBirthDateChange: (value: string) => void
  onSexChange: (value: BiologicalSex) => void
  onSubmit: () => void
}

export function OnboardingForm({
  birthDate,
  sex,
  dateIsValid,
  submitted,
  revealDelayMs,
  onBirthDateChange,
  onSexChange,
  onSubmit,
}: OnboardingFormProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const effectiveRevealDelayMs = prefersReducedMotion ? 0 : revealDelayMs
  const stackRef = useRef<HTMLDivElement | null>(null)
  const [showSexPrompt, setShowSexPrompt] = useState(false)
  const [showSubmitButton, setShowSubmitButton] = useState(false)
  const [stackOffsetY, setStackOffsetY] = useState(0)

  useEffect(() => {
    if (!dateIsValid) {
      setShowSexPrompt(false)
      setShowSubmitButton(false)
      return
    }

    if (effectiveRevealDelayMs <= 0) {
      setShowSexPrompt(true)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShowSexPrompt(true)
    }, effectiveRevealDelayMs)

    return () => window.clearTimeout(timeoutId)
  }, [dateIsValid, effectiveRevealDelayMs])

  useEffect(() => {
    if (!sex || !showSexPrompt) {
      setShowSubmitButton(false)
      return
    }

    if (effectiveRevealDelayMs <= 0) {
      setShowSubmitButton(true)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShowSubmitButton(true)
    }, effectiveRevealDelayMs)

    return () => window.clearTimeout(timeoutId)
  }, [effectiveRevealDelayMs, sex, showSexPrompt])

  useLayoutEffect(() => {
    const stackElement = stackRef.current

    if (!stackElement) {
      return
    }

    setStackOffsetY(-(stackElement.getBoundingClientRect().height / 2))
  }, [showSexPrompt, showSubmitButton])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      data-testid="onboarding-form"
      aria-hidden={submitted}
      className={cn(
        "absolute left-1/2 top-1/3 z-10 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 px-6 transition-opacity duration-1000 ease-out motion-reduce:duration-0",
        submitted ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      onSubmit={handleSubmit}
    >
      <div
        ref={stackRef}
        data-testid="onboarding-motion-stack"
        className="transition-transform [transition-duration:520ms] ease-out motion-reduce:transition-none"
        style={{ transform: `translateY(${stackOffsetY}px)` }}
      >
        <FieldGroup className="items-center gap-10 text-center">
          <OnboardingDateField
            id="onboarding-birth-date"
            birthDateISO={birthDate}
            onBirthDateChange={onBirthDateChange}
          />

          {showSexPrompt ? (
            <OnboardingSexField value={sex} onChange={onSexChange} />
          ) : null}

          {showSubmitButton ? (
            <Button
              type="submit"
              className="h-14 w-fit animate-question-reveal px-7 text-xl hover:-translate-y-0.5"
            >
              Show days
            </Button>
          ) : null}
        </FieldGroup>
      </div>
    </form>
  )
}

function usePrefersReducedMotion(): boolean {
  const mediaQuery = useMemo(() => {
    if (typeof window === "undefined") {
      return null
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)")
  }, [])

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => mediaQuery?.matches ?? false,
  )

  useEffect(() => {
    if (!mediaQuery) {
      return
    }

    function handleChange() {
      setPrefersReducedMotion(mediaQuery?.matches ?? false)
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [mediaQuery])

  return prefersReducedMotion
}

interface OnboardingSexFieldProps {
  value: BiologicalSex | null
  onChange: (value: BiologicalSex) => void
}

function OnboardingSexField({ value, onChange }: OnboardingSexFieldProps) {
  return (
    <FieldSet className="items-center gap-4 text-center animate-question-reveal">
      <FieldLegend
        variant="label"
        className="data-[variant=label]:text-2xl leading-8"
      >
        I was born a
      </FieldLegend>
      <RadioGroup
        value={value ?? ""}
        onValueChange={(nextValue) => onChange(nextValue as BiologicalSex)}
        aria-label="I was born a"
        className="flex items-center justify-center gap-8"
      >
        <Field
          orientation="horizontal"
          data-selected={value === "male" ? "true" : undefined}
          className="life-radio-option w-auto gap-3"
        >
          <RadioGroupItem
            id="onboarding-male"
            value="male"
            className="size-5"
          />
          <FieldLabel htmlFor="onboarding-male" className="text-xl font-normal">
            Male
          </FieldLabel>
        </Field>
        <Field
          orientation="horizontal"
          data-selected={value === "female" ? "true" : undefined}
          className="life-radio-option w-auto gap-3"
        >
          <RadioGroupItem
            id="onboarding-female"
            value="female"
            className="size-5"
          />
          <FieldLabel htmlFor="onboarding-female" className="text-xl font-normal">
            Female
          </FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  )
}
