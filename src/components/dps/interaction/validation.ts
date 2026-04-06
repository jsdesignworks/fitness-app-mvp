import type { ZodIssue, ZodSchema } from 'zod'

export type DpsValidateSuccess<T> = { ok: true; data: T }

export type DpsValidateFailure = {
  ok: false
  /** First issue with empty path or custom form-level message */
  formError?: string
  /** First Zod issue message per top-level field key (first path segment) */
  fieldErrors: Record<string, string>
}

/**
 * Maps Zod issues to a flat `fieldErrors` map (first message wins per key).
 * Issues with an empty path use key `_root` (use for `formError` extraction).
 */
export function zodIssuesToFieldErrors(issues: ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key =
      issue.path.length === 0 ? '_root' : String(issue.path[0])
    if (!out[key]) {
      out[key] = issue.message
    }
  }
  return out
}

/**
 * Client-side Zod parse for forms. Map `fieldErrors` to `DpsFormField` `error` props.
 * Server/API validation stays in services — this is UX-only.
 */
export function dpsValidate<T>(schema: ZodSchema<T>, input: unknown): DpsValidateSuccess<T> | DpsValidateFailure {
  const result = schema.safeParse(input)
  if (result.success) {
    return { ok: true, data: result.data }
  }
  const raw = zodIssuesToFieldErrors(result.error.issues)
  const formError = raw['_root']
  const fieldErrors = { ...raw }
  delete fieldErrors['_root']
  return {
    ok: false,
    formError,
    fieldErrors,
  }
}
